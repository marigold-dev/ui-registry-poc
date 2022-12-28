import { useEffect, useState } from "react";
import { arg, endpoint } from "../../mock/types";

type props = {
  endpoints: endpoint[];
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

export default function TemplateInformations({ endpoints }: props) {
  const [selectedView, setSelectedView] = useState(0);
  const [selected, setSelected] = useState(endpoints[0]);

  useEffect(() => {
    setSelected(endpoints[0]);
  }, [endpoints]);

  return (
    <section>
      <div className="border-b pt-2 space-x-2">
        <button
          className={`${
            selectedView === 0 ? "text-ligo border-b-2 border-ligo" : ""
          } p-2 font-medium translate-y-px`}
          onClick={() => {
            setSelectedView(0);
          }}
        >
          Endpoints
        </button>
      </div>
      <div className="flex">
        <ul className="py-2 pr-4 overflow-auto space-y-1">
          {endpoints.map(({ name }, i) => (
            <li key={i}>
              <a
                href="#"
                className={`${
                  selected.name === name ? "text-ligo underline" : ""
                } hover:text-ligo`}
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
            {/* <p className="text-slate-700">description</p> */}
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
                  {selected.args.map((arg) => (
                    <tr className="border-b">
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
    </section>
  );
}
