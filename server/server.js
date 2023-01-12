const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { updateRepo } = require("./templates");
const { templates } = require("./constants");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const updateRepos = async () => {
  try {
    console.log("Pulling repos");
    await Promise.all(
      templates.map((template) =>
        updateRepo(
          template.repository.replace("https://github.com/ligolang/", "")
        )
      )
    );
    console.log("Pulled repos");
  } catch (e) {
    console.error("Pull error: ", e);
  }
};

setInterval(
  updateRepos,
  // Every 5min
  60000 * 5
);

// updateRepos();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (pathname.includes("/api")) {
        Object.assign(req, {
          templates,
        });

        await handle(req, res, parsedUrl);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
