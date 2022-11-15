import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";

import { RouterProvider } from "react-router-dom";
import Router from "./Router";
import {
  toolkit as tezosToolkit,
  useAuditor,
  useAuditorDispatch,
} from "./context/AuditorContext";
import { useEffect, useState } from "react";
import useInterval from "./hooks/useInterval";
import { getTezosBlockHash } from "./context/AuditorAction";
import {
  getTezosCurrentBlockLevel,
  getTezosCurrentBlockHash,
  getContract,
  getStorage,
} from "./api/Tezos";

import { AUDITOR_SC_ADDRESS, BLOCK_FREQUENCY } from "./config";
import RawStorage from "./api/AuditorSc/RawStorage";

const App = () => {
  const dispatch = useAuditorDispatch();
  const state = useAuditor();
  const [clock, setClock] = useState(0);
  const [lastBlockHash, setLastBlockHash] = useState<string | null>(null);

  useInterval(() => setClock(clock + 1), BLOCK_FREQUENCY);

  useEffect(() => {
    let subscription = true;
    if (state.type === "NOT_ASKED" || state.type === "BOOTED") {
      const fetchBlock = async () => {
        if (subscription) {
          console.log("fetch the current block");
          const toolkit = tezosToolkit;
          const currentBlockHash = await getTezosCurrentBlockHash(toolkit);
          const currentBlockLevel = await getTezosCurrentBlockLevel(toolkit);
          const contract = await getContract(toolkit, AUDITOR_SC_ADDRESS);
          const storage = await getStorage<RawStorage>(contract);
          console.log([
            "block fetched",
            currentBlockHash,
            currentBlockLevel,
            contract,
          ]);
          if (lastBlockHash !== currentBlockHash) {
            setLastBlockHash(currentBlockHash);
            dispatch(
              getTezosBlockHash(
                currentBlockHash,
                currentBlockLevel,
                contract,
                storage
              )
            );
          }
        }
      };
      fetchBlock();
    }
    return () => {
      subscription = false;
    };
  }, [lastBlockHash, clock, state, dispatch]);

  return <RouterProvider router={Router} />;
};

export default App;
