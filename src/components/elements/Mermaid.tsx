import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

type props = {
  children: string;
};

mermaid.mermaidAPI.initialize({
  startOnLoad: true,
  theme: "dark",
});

const Mermaid = ({ children }: props) => {
  const id = useRef(
    `id-${Math.round(Math.random() * 10000).toString()}`
  ).current;

  const [graph, setGraph] = useState("");

  useEffect(() => {
    setGraph(mermaid.mermaidAPI.render(id, children));
  }, []);

  return (
    <div
      className="flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: graph }}
    ></div>
  );
};

export default Mermaid;
