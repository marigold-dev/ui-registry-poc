import { Template } from "../../types";

const advisorCameligo: Template = {
  name: "Advisor-Cameligo",
  category: "utilities",
  repository: "https://github.com/ligolang/advisor-cameligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "Exemple of an advisor contract in CameLIGO",
  readme: `# ligo lambdas & on-chain views

This repository is meant to illustrate the communication between contracts (with on-chain views) and lambda pattern which allows to modify a contract already deployed. It deals with implementing, deploying and interacting with Tezos smart contracts.

## The Fund and its advisor (i.e. "L'indice et le conseiller")

The \`indice\` contract represents a fund value and the \`advisor\` contract gives an advice on investing on this fund.

### Transaction workflow

Since Hangzhou protocol, on-chain views have been introduced which replace the callback pattern to retrieve a storage of another contract.

The \`advisor\` contract can be invoked to request the fund value from the \`indice\` contract (via an on-chain view). The \`indice\` contract receives the view request and sends back the requested value. When \`advisor\` contract receives the fund value it can apply the "algorithm" to check it is worth investing ! This algorithm relies on a single indice value.

![](assets/indice&advisor.png)

The resulting advice is stored in the storage (in \`result\` field).

### Lambda pattern

The real business logic of the \`advisor\` smart contract lies in the lambda function which is defined in the storage. The storage is vowed to be modified so as for the business logic (lambda).

So an entrypoint \`ChangeAlgorithm\` is provided to modify the algorithm that computes the worth of investment.

## Content

This directory illustrates the new on-chain views style and contains 2 implementations:

- cameligo: for smart contracts implementation in cameligo and \`ligo\` command lines for simulating all entrypoints
- jsligo: for smart contracts implementation in JSligo and \`ligo\` command lines for simulating all entrypoints

## Pre-requisites

You need to install the following tools:

- [NodeJS & Npm](https://nodejs.org/en/download/)
- [LIGO](https://ligolang.org/docs/intro/installation/) **or** [Docker](https://docs.docker.com/get-docker/)

## Compiling / testing / deploying

This repository provides a Makefile for compiling and testing smart contracts. One can type \`make\` to display all available rules.
The \`make all\` command will clean all produced smart contracts, then compile smart contracts and then launch tests.

- The \`make compile\` command triggers the compilation of smart contracts (advisor and indice).

- The \`make test\` command launches tests oon compiled smart contracts (advisor and indice).

- The \`make deploy\` command deploys smart contracts. You need to rename \`deploy/.env.dist\` to \`deploy/.env\` and **fill the required variables**.

You can also override \`make\` parameters by running :

\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`
`,
  mainFile: `#import "errors.mligo" "Errors"
#import "parameter.mligo" "Parameter"
#import "storage.mligo" "Storage"

type storage = Storage.Types.t
type parameter = Parameter.Types.t
type return = operation list * storage

let advisorMain(ep, store : Parameter.Types.t * Storage.Types.t) : return = 
    ([] : operation list), (match ep with
    | ChangeAlgorithm(p) -> Storage.Utils.change(p, store)
    | ExecuteAlgorithm(_p) -> Storage.Utils.executeAlgorithm(store) 
    )`,
};

const advisorJsligo: Template = {
  name: "Advisor-JSLigo",
  category: "utilities",
  repository: "https://github.com/ligolang/advisor-jsligo/",
  author: { name: "LIGO" },
  version: "1.0",
  description: "Exemple of an advisor contract in JSLigo",
  readme: `# ligo lambdas & on-chain views

This repository is meant to illustrate the communication between contracts (with on-chain views) and lambda pattern which allows to modify a contract already deployed. It deals with implementing, deploying and interacting with Tezos smart contracts.

## The Fund and its advisor (i.e. "L'indice et le conseiller")

The \`indice\` contract represents a fund value and the \`advisor\` contract gives an advice on investing on this fund.

### Transaction workflow

Since Hangzhou protocol, on-chain views have been introduced which replace the callback pattern to retrieve information from the storage of another contract.

The \`executeAlgorithm\` entrypoint of the \`advisor\` contract requests the fund value from the \`indice\` contract (via an on-chain view). The storage of the \`indice\` contract is retrieved with a \`Tezos.call_view\` instruction inside the entrypoint of the \`advisor\` contract which can apply the "algorithm" to check if it is worth investing ! This algorithm relies on a single indice value.

![](assets/indice&advisor.png)

The resulting advice is stored in the storage (in \`result\` field).

### Lambda pattern

The real business logic of the \`advisor\` smart contract lies in the lambda function which is defined in the storage. The storage is vowed to be modified so as for the business logic (lambda).

So an entrypoint \`ChangeAlgorithm\` is provided to modify the algorithm that computes the worth of investment.

## Content

This repository illustrates the new on-chain views style and contains a jsligo implementations for smart contracts and \`ligo\` command lines for simulating all entrypoints.

## Pre-requisites

You need to install the following tools:

- [NodeJS & Npm](https://nodejs.org/en/download/)
- [LIGO](https://ligolang.org/docs/intro/installation/) **or** [Docker](https://docs.docker.com/get-docker/)

## Compiling / testing / deploying

This repository provides a Makefile for compiling and testing smart contracts. One can type \`make\` to display all available rules.
The \`make all\` command will clean all produced smart contracts, then compile smart contracts and then launch tests.

- The \`make compile\` command triggers the compilation of smart contracts (advisor and indice).

- The \`make test\` command launches tests oon compiled smart contracts (advisor and indice).

- The \`make deploy\` command deploys smart contracts. You need to rename \`deploy/.env.dist\` to \`deploy/.env\` and **fill the required variables**.

You can also override \`make\` parameters by running :

\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`
`,
  mainFile: `#import "storage.jsligo" "Storage"
#import "parameter.jsligo" "Parameter"


export type storage = Storage.Types.t;
export type parameter = Parameter.Types.t;
export type return_ = [list<operation>, storage];


const advisorMain = ([ep, store] : [parameter, storage]) : return_ => {
    return [(list([]) as list<operation>), match (ep, {
        ChangeAlgorithm: (p: advisorAlgo) => Storage.Utils.change(p, store),
        ExecuteAlgorithm: (_p: unit) => Storage.Utils.executeAlgorithm(store) 
    })];
};`,
};

const data = {
  map: {
    [advisorCameligo.name]: advisorCameligo,
    [advisorJsligo.name]: advisorJsligo,
  },
  all: [advisorCameligo, advisorJsligo],
};

export default data;
