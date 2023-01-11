const { TEMPLATES_PATH, templates: baseTemplates } = require("./constants");
const { readFileSync, existsSync, readdirSync } = require("fs");
const { exec } = require("child_process");

let templates = baseTemplates;
const EXCLUDED_DIRS = [
  "assets",
  "compiled",
  "deploy",
  "esy.lock",
  "_esy",
  ".ligo",
  ".git",
  "docs",
];

const cloneRepo = (url) => {
  const repoName = url.replace("https://github.com/ligolang/", "");
  return new Promise((resolve, reject) => {
    if (existsSync(`${TEMPLATES_PATH}/${repoName}`)) return resolve("Skip");

    exec(`git -C ${TEMPLATES_PATH} clone ${url}`, (error, _, __) => {
      if (!!error) return reject(error);

      exec(`cd ${TEMPLATES_PATH}/${repoName} && make install`, () => {
        exec(`cd ${TEMPLATES_PATH}/${repoName} && make compile`, () => {
          exec(
            `cd ${TEMPLATES_PATH}/${repoName} && cp deploy/.env.dist deploy/.env`,
            () => {
              resolve("Nice");
            }
          );
        });
      });
    });
  });
};

const updateRepo = (name) => {
  return new Promise((resolve, reject) => {
    if (!existsSync(`${TEMPLATES_PATH}/${name}`)) return reject();

    exec(`git -C ${TEMPLATES_PATH}/${name} pull`, (error, _, __) => {
      if (!!error) return reject(error);

      resolve();
    });
  });
};

const getReadme = (templateName) => {
  let readme = "";

  const base = `${TEMPLATES_PATH}/${templateName}`;

  if (existsSync(`${base}/README.md`)) {
    readme = readFileSync(`${TEMPLATES_PATH}/${templateName}/README.md`);
  } else {
    readme = readFileSync(`${TEMPLATES_PATH}/${templateName}/readme.md`);
  }

  return readme.toString();
};

const updateReadmes = async () => {
  templates = await Promise.all(
    templates.map((template) => {
      const readme = getReadme(
        template.repository.replace("https://github.com/ligolang/", "")
      );

      return {
        ...template,
        readme,
      };
    })
  );
};

const parseArgs = (args) => {
  return args.reduce((acc, curr) => {
    return [
      ...acc,
      {
        type: curr.prim,
        name: !!curr.annots ? curr.annots[0].replace("%", "") : null,
        content: !!curr.args ? parseArgs(curr.args) : [],
      },
    ];
  }, []);
};

const parseParameter = (parameter) => {
  if (!parameter.annots)
    return parameter.args.reduce((acc, curr) => {
      const params = parseParameter(curr);

      if (Array.isArray(params)) return [...acc, ...params];
      else return [...acc, params];
    }, []);

  return {
    name: !!parameter.annots ? parameter.annots[0].replace("%", "") : null,
    args: (() => {
      if (!parameter.args)
        return [
          {
            type: parameter.prim,
            name: null,
            content: null,
          },
        ];
      else return parseArgs(parameter.args);
    })(),
  };
};

const parseEndpoints = (url) => {
  const repoName = url.replace("https://github.com/ligolang/", "");

  const base = `${TEMPLATES_PATH}/${repoName}/compiled`;

  const files = readdirSync(base).filter((file) => file.includes(".json"));

  const parameters = files
    .map((name) => ({
      name,
      content: JSON.parse(readFileSync(`${base}/${name}`).toString())[0],
    }))
    .filter(({ content }) => content.prim === "parameter");

  return parameters.map(({ name, content }) => ({
    contract: name.replace(".json", ""),
    params: parseParameter(content),
  }));
};

const readRecursiveFiles = (path) =>
  readdirSync(path, { withFileTypes: true }).flatMap((f) => {
    if (f.isFile() && f.name.includes("ligo") && f.name !== ".ligoproject") {
      const filePath = `${path}/${f.name}`;

      return [
        {
          path: filePath,
          content: readFileSync(filePath).toString(),
        },
      ];
    } else if (f.isDirectory() && !EXCLUDED_DIRS.includes(f.name)) {
      return readRecursiveFiles(`${path}/${f.name}`);
    } else {
      return [];
    }
  });

const readAllFiles = (url) => {
  const repoName = url.replace("https://github.com/ligolang/", "");

  const base = `${TEMPLATES_PATH}/${repoName}`;

  return readRecursiveFiles(base).map(({ path, content }) => ({
    content,
    path: path.replace(`${base}/`, ""),
  }));
};

let alreadySetup = false;

const setup = async () => {
  if (alreadySetup) return;

  await Promise.all(
    templates.map((template) => cloneRepo(template.repository))
  );

  await updateReadmes();

  templates = templates.map((template) => {
    return {
      ...template,
      endpoints: parseEndpoints(template.repository),
      files: readAllFiles(template.repository),
    };
  });

  alreadySetup = true;
};

const deploy = async (repoLink) => {
  return new Promise((resolve, reject) => {
    const repoName = repoLink.replace("https://github.com/ligolang/", "");

    if (!process.env.PK) throw new Error("PK env var missing");

    exec(
      `PK=${process.env.PK} cd ${TEMPLATES_PATH}/${repoName} && make deploy`,
      (error, stdout, stderr) => {
        if (!!error) {
          console.log(stderr);
          return reject(error);
        }

        resolve(
          [...stdout.matchAll(/- ?([a-zA-Z]+)?:? (KT.+)/g)].map(
            ([_, name, address]) => ({
              name,
              address,
            })
          )
        );
      }
    );
  });
};

const getTemplates = async () => {
  console.log("SETUP");
  await setup();

  console.log("ICI: ", templates[0].endpoints);
  return templates;
};

module.exports = {
  setup,
  getTemplates,
  deploy,
  updateRepo,
};
