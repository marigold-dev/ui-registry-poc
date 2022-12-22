const { TEMPLATES_PATH, templates: baseTemplates } = require("./constants");
const { readFileSync, existsSync } = require("fs");
const { exec } = require("child_process");

let templates = baseTemplates;

const cloneRepo = (url) => {
  const repoName = url.replace("https://github.com/ligolang/", "");
  return new Promise((resolve, reject) => {
    if (existsSync(`${TEMPLATES_PATH}/${repoName}`)) return resolve();

    exec(`git -C ${TEMPLATES_PATH} clone ${url}`, (error, _, __) => {
      if (!!error) return reject(error);

      exec(`cd ${TEMPLATES_PATH}/${repoName} && make install`, (...all) => {
        exec(`cd ${TEMPLATES_PATH}/${repoName} && make compile`);
      });

      exec(
        `cd ${TEMPLATES_PATH}/${repoName} && cp deploy/.env.dist deploy/.env`
      );

      resolve();
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

const setup = async () => {
  await Promise.all(
    templates.map((template) => cloneRepo(template.repository))
  );

  await updateReadmes();
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

(async () => {
  await setup();
})();

const getTemplates = async () => {
  await updateReadmes();

  return templates;
};

module.exports = {
  setup,
  getTemplates,
  deploy,
  updateRepo,
};
