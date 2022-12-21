import type { NextApiRequest, NextApiResponse } from "next";
import { deploy } from "../../server/templates";

type templates = {
  templates: {
    name: string;
    repository: string;
  }[];
};

export default async (
  req: NextApiRequest & templates,
  res: NextApiResponse
) => {
  const { template } = req.query;

  if (!template) {
    return res.status(400).json({ err: "Invalid template" });
  }

  const toDeploy = req.templates.find(
    (template) => template.name === template.name
  );

  if (!toDeploy) {
    return res.status(400).json({ err: "Invalid template" });
  }

  try {
    await deploy(toDeploy.repository);
    res.status(200).json({});
  } catch (e) {
    res.status(500).json({ err: "Failed to deploy contract" });
  }
};
