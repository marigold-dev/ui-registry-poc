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
  if (req.method !== "POST") return res.status(405).end();

  const { template } = req.query;

  if (!template) {
    return res.status(400).json({ err: "Invalid template" });
  }

  const toDeploy = req.templates.find(
    (t) => t.name.toLowerCase() === (template as string).toLowerCase()
  );

  if (!toDeploy) {
    return res.status(400).json({ err: "Invalid template" });
  }

  try {
    const deployed = await deploy(toDeploy.repository);

    res.status(200).json(deployed);
  } catch (e) {
    console.log(e);
    res.status(500).json({ err: "Failed to deploy contract" });
  }
};
