import { Template } from "../../types";

const multisigCameligo: Template = {
  name: "Multisig-Cameligo",
  category: "governance",
  repository: "https://github.com/ligolang/multisig-cameligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "An exemple of multisig contract in CameLIGO",
  readme: `# Multi signature

This exeample is meant to illustrate a transaction requiring multiple people's confirmation before the operation is executed. With this MVP example smart-contrat, we show how to use multisig-type confirmation from M of N signers in order to send an operation. In this example, we will bind a call to a token transfer from another smart-contrat, since it’s the most classic use case ( Fungible Asset 2 ).

## The multisig pattern

Step Zero : deploy the contract with desired parameters and bind it to the entrypoint to execute. Each time a multisignature is required :

1. A signer proposes a new operation execution with parameters
2. M of N possible signers submit an approval transaction to the smart-contrat
3. When the last required signer submits their approval transaction and the threshold is obtained, the resulting original transaction of the first signer is executed

Any number of operations can be in valid execution at the same time.

The multisig contract can be invoked to request any operation on other smart contracts.

## Content

The \`multisig\` directory contains 2 directories:
- cameligo: for smart contracts implementation in cameligo and \`ligo\` command lines for simulating all entrypoints
- jsligo: for smart contracts implementation in JSligo and \`ligo\` command lines for simulating all entrypoints

## Compiling / testing / deploying

This repository provides a Makefile for compiling and testing smart contracts. One can type \`make\` to display all available rules.
The \`make all\` command will delete the compiled smart contract, then compile the smart contract and then launch tests.

The \`make compile\` command triggers the compilation of the smart contract.

The \`make test\` command launches tests on the compiled smart contract.

The \`make deploy\` command deploys the smart contract (depending on .env file information).

You can also override make parameters by running :
\`\`\`sh
make compile ligo_compile=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`
`,
  mainFile: `#import "../common/constants.mligo" "Constants"
#import "parameter.mligo" "Parameter"
#import "storage.mligo" "Storage"
#import "conditions.mligo" "Conditions"
#import "contracts/fa2.mligo" "FA2"

// ===============================================================================================

module Preamble = struct
    [@inline]
    let prepare_new_proposal (params, storage: Parameter.Types.proposal_params * Storage.Types.t) : Storage.Types.proposal =
        let () = Conditions.only_signer storage in
        let () = Conditions.amount_must_be_zero_tez (Tezos.get_amount ()) in
        Storage.Utils.create_proposal params

    [@inline]
    let retrieve_a_proposal (proposal_number, storage: Parameter.Types.proposal_number * Storage.Types.t) : Storage.Types.proposal =
        let () = Conditions.only_signer storage in
        let target_proposal = Storage.Utils.retrieve_proposal(proposal_number, storage) in
        let () = Conditions.not_yet_signer target_proposal in
        target_proposal
end

// ===============================================================================================

type request = Parameter.Types.t * Storage.Types.t
type result = operation list * Storage.Types.t

(**
 * Proposal creation
 *)
let create_proposal (params, storage : Parameter.Types.proposal_params * Storage.Types.t) : result =
    let proposal = Preamble.prepare_new_proposal(params, storage) in
    let storage = Storage.Utils.register_proposal(proposal, storage) in
    (Constants.no_operation, storage)

(**
 * Proposal signature
 *)

 // LIGO INFO UNCURRIED FUNCTION DOESN'T WORK
let sign_proposal (proposal_number, storage : Parameter.Types.proposal_number * Storage.Types.t) : result =
    let proposal = Preamble.retrieve_a_proposal(proposal_number, storage) in

    let proposal = Storage.Utils.add_signer_to_proposal(proposal, (Tezos.get_sender ()), storage.threshold) in
    let storage = Storage.Utils.update_proposal(proposal_number, proposal, storage) in

    let operations = FA2.perform_operations proposal in

    (operations, storage)

// ===============================================================================================

let main (action, storage : request) : result =
    match action with
    | Create_proposal(proposal_params) ->
        create_proposal (proposal_params, storage)
    | Sign_proposal(proposal_number) ->
        sign_proposal (proposal_number, storage)
`,
};

const multisigJsligo: Template = {
  name: "Multisig-JsLIGO",
  category: "governance",
  repository: "https://github.com/ligolang/multisig-jsligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "An exemple of multisig contract in JsLIGO",
  readme: `# Multi signature

This exeample is meant to illustrate a transaction requiring multiple people's confirmation before the operation is executed. With this MVP example smart-contrat, we show how to use multisig-type confirmation from M of N signers in order to send an operation. In this example, we will bind a call to a token transfer from another smart-contrat, since it’s the most classic use case ( Fungible Asset 2 ).

## The multisig pattern

Step Zero : deploy the contract with desired parameters and bind it to the entrypoint to execute. Each time a multisignature is required :

1. A signer proposes a new operation execution with parameters
2. M of N possible signers submit an approval transaction to the smart-contrat
3. When the last required signer submits their approval transaction and the threshold is obtained, the resulting original transaction of the first signer is executed

Any number of operations can be in valid execution at the same time.

The multisig contract can be invoked to request any operation on other smart contracts.

## Content

The \`multisig\` directory contains 2 directories:
- cameligo: for smart contracts implementation in cameligo and \`ligo\` command lines for simulating all entrypoints
- jsligo: for smart contracts implementation in JSligo and \`ligo\` command lines for simulating all entrypoints

## Compiling / testing / deploying

This repository provides a Makefile for compiling and testing smart contracts. One can type \`make\` to display all available rules.
The \`make all\` command will delete the compiled smart contract, then compile the smart contract and then launch tests.

The \`make compile\` command triggers the compilation of the smart contract.

The \`make test\` command launches tests on the compiled smart contract.

The \`make deploy\` command deploys the smart contract (depending on .env file information).

You can also override make parameters by running :
\`\`\`sh
make compile ligo_compile=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`
`,
  mainFile: `#import "../common/constants.mligo" "Constants"
#import "parameter.jsligo" "Parameter"
#import "storage.jsligo" "Storage"
#import "conditions.jsligo" "Conditions"
#import "contracts/fa2.jsligo" "FA2"

// ===============================================================================================

namespace Preamble {
    const prepare_new_proposal = ([params, storage]: [Parameter.Types.proposal_params, Storage.Types.t]): Storage.Types.proposal => {
        Conditions.only_signer(storage);
        Conditions.amount_must_be_zero_tez((Tezos.get_amount ())); 
        return Storage.Utils.create_proposal(params);
    };

    const retrieve_a_proposal = ([proposal_number, storage]: [nat, Storage.Types.t]): Storage.Types.proposal => {
        Conditions.only_signer(storage);
        const target_proposal: Storage.Types.proposal = Storage.Utils.retrieve_proposal(proposal_number, storage);
        Conditions.not_yet_signer(target_proposal);
        return target_proposal;
    };
};

// ===============================================================================================

type request = [Parameter.Types.t, Storage.Types.t];
export type result = [list<operation>, Storage.Types.t];


const create_proposal = ([params, storage]: [Parameter.Types.proposal_params, Storage.Types.t]): result => {
    const proposal = Preamble.prepare_new_proposal(params, storage);
    const final_storage = Storage.Utils.register_proposal(proposal, storage);
    return [Constants.no_operation, final_storage];
};



const sign_proposal = ([proposal_number, storage]: [nat, Storage.Types.t]): result => {
    let proposal = Preamble.retrieve_a_proposal(proposal_number, storage);
    proposal = Storage.Utils.add_signer_to_proposal(proposal, (Tezos.get_sender ()), storage.threshold);
    const final_storage = Storage.Utils.update_proposal(proposal_number, proposal, storage);
    const operations = FA2.perform_operations(proposal);

    return [operations, final_storage];
};

// ===============================================================================================

const main = ([action, store]: [Parameter.Types.t, Storage.Types.t]): result => (match (action, {
        Create_proposal: (p: Parameter.Types.proposal_params) => create_proposal(p, store),
        Sign_proposal:   (p: nat) => sign_proposal(p, store)
    }));
`,
};

export default {
  map: {
    [multisigCameligo.name]: multisigCameligo,
    [multisigJsligo.name]: multisigJsligo,
  },
  all: [multisigCameligo, multisigJsligo],
};
