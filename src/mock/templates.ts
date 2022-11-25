import { Template } from "./types";

const templates: Template[] = [
  {
    name: "Test template",
    readme: "# Test template",
    mainFile: "#import 'storage.ligo'",
    category: "token",
    description: "What a cool template",
  },
  {
    name: "Test template 2",
    readme: "# Test template 2",
    mainFile: "#import 'storage.ligo'",
    category: "token",
    description: "What a cool template",
  },
  {
    name: "Test template 3",
    readme: "# Test template 3",
    mainFile: "#import 'storage.ligo'",
    category: "governance",
    description: "What a cool template",
  },
  {
    name: "Test template 4",
    readme: "# Test template 4",
    mainFile: "#import 'storage.ligo'",
    category: "governance",
    description: "What a cool template",
  },
  {
    name: "Test template 5",
    readme: "# Test template 5",
    mainFile: "#import 'storage.ligo'",
    category: "utilities",
    description: "What a cool template",
  },
  {
    name: "Test template 6",
    readme: "# Test template 6",
    mainFile: "#import 'storage.ligo'",
    category: "utilities",
    description: "What a cool template",
  },
];

const token = templates.filter((t) => t.category === "token");
const governance = templates.filter((t) => t.category === "governance");
const utilities = templates.filter((t) => t.category === "utilities");

export default {
  templates,
  categories: {
    token,
    governance,
    utilities,
  },
};
