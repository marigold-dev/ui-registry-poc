import { useEffect, useState } from "react";
import { arg, endpoint, file } from "../../mock/types";

type props = {
  endpoints: endpoint[];
  files: file[];
};

const renderArgType = (arg: arg, depth = 0): string => {
  if (!arg.content || arg.content.length === 0)
    return `${!!arg.name && depth !== 0 ? arg.name + ": " : ""}${arg.type}`;

  if (arg.type === "or")
    return `or (${arg.content
      .map((v) => renderArgType(v, depth + 1))
      .join(", ")})`;

  if (arg.type === "pair")
    return `(${arg.content
      .map((v) => renderArgType(v, depth + 1))
      .join(", ")})`;

  return `${arg.type} ${arg.content
    .map((v) => renderArgType(v, depth + 1))
    .join(", ")}`;
};

const Endpoints = ({ endpoints }: { endpoints: endpoint[] }) => {
  const [selected, setSelected] = useState(endpoints[0]);

  useEffect(() => {
    setSelected(endpoints[0]);
  }, [endpoints]);

  return (
    <div className="flex max-h-96">
      <ul className="py-2 pr-4 overflow-auto space-y-1">
        {endpoints.map(({ name }, i) => (
          <li key={i}>
            <a
              href="#"
              className={`${
                selected.name === name ? "text-ligo-600 underline" : ""
              } hover:text-ligo-600`}
              onClick={(e) => {
                e.preventDefault();
                setSelected(endpoints[i]);
              }}
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
      <div className="py-2 px-4 flex-1">
        <section className="border-b py-2">
          <h4 className="text-xl font-bold">{selected.name}</h4>
        </section>
        <section>
          <h5 className="text-md font-bold mt-2">Arguments</h5>
          <div className="w-full border rounded overflow-hidden mt-4">
            <table className="w-full rounded">
              <thead className="bg-slate-300 rounded">
                <tr>
                  <th className="pl-2">Name</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {selected.args.map((arg, i) => (
                  <tr key={i} className="border-b">
                    <td className="pl-2 py-2">{arg.name ?? "-"}</td>
                    <td className="pt-2 overflow-x-auto">
                      {renderArgType(arg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const Sources = ({ files }: { files: file[] }) => {
  const [selected, setSelected] = useState(files[0]);

  useEffect(() => {
    setSelected(files[0]);
  }, [files]);

  return (
    <div className="flex max-h-96">
      <ul className="py-2 pr-4 overflow-auto space-y-1">
        {files.map(({ path }, i) => (
          <li key={i}>
            <a
              href="#"
              className={`${
                selected.path === path ? "text-ligo-600 underline" : ""
              } hover:text-ligo-600`}
              onClick={(e) => {
                e.preventDefault();
                setSelected(files[i]);
              }}
            >
              {path}
            </a>
          </li>
        ))}
      </ul>
      <div className="py-2 px-4 flex-1 flex flex-col">
        <section className="border-b py-2">
          <h4 className="text-xl font-bold">{selected.path}</h4>
          {/* <p className="text-slate-700">description</p> */}
        </section>
        <div
          className="w-full rounded max-w-3xl overflow-y-auto"
          style={{ height: "calc(100% - 3.30rem)" }}
        >
          <pre className="text-white bg-slate-800 mt-4 px-3 py-4 rounded overflow-auto">
            <code
              className="h-full"
              dangerouslySetInnerHTML={{
                __html: selected.content.replace(/\n/g, "<br/>"),
              }}
            ></code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default function TemplateInformations({ endpoints, files }: props) {
  const [selectedView, setSelectedView] = useState(0);

  return (
    <section>
      <div className="border-b pt-2 space-x-2">
        <button
          className={`${
            selectedView === 0 ? "text-ligo-600 border-b-2 border-ligo" : ""
          } p-2 font-medium translate-y-px`}
          onClick={() => {
            setSelectedView(0);
          }}
        >
          Endpoints
        </button>
        <button
          className={`${
            selectedView === 1 ? "text-ligo-600 border-b-2 border-ligo" : ""
          } p-2 font-medium translate-y-px`}
          onClick={() => {
            setSelectedView(1);
          }}
        >
          Sources
        </button>
      </div>
      {(() => {
        if (selectedView === 0) return <Endpoints endpoints={endpoints} />;
        else if (selectedView === 1) return <Sources files={files} />;
        else return null;
      })()}
    </section>
  );
}
