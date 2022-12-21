const { TEMPLATES_PATH, templates: baseTemplates } = require("./constants");
const { readFileSync, existsSync } = require("fs");
const { exec } = require("child_process");

let templates = baseTemplates;

const cloneRepo = (url) => {
  return new Promise((resolve, reject) => {
    if (
      existsSync(
        `${TEMPLATES_PATH}/${url.replace("https://github.com/ligolang/", "")}`
      )
    )
      return resolve();

    exec(`git -C ${TEMPLATES_PATH} clone ${url}`, (error, _, __) => {
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

const setup = async () => {
  await Promise.all(
    templates.map((template) => cloneRepo(template.repository))
  );

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

const deploy = async (repoLink) => {};

(async () => {
  await setup();
})();

const getTemplates = () => {
  return templates;
};

module.exports = {
  setup,
  getTemplates,
  deploy,
};
