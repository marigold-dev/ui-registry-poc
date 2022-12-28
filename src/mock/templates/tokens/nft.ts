import { Template } from "../../types";

const nftFactoryCameligo: Template = {
  name: "NFT-Factory-Cameligo",
  category: "token",
  repository: "https://github.com/ligolang/NFT-factory-cameligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "Exemple of a NFT Factory contract in CameLIGO ",
  readme: `## Contract VIN (Vinus In Numeris)

This contract implements a factory of FA2 NFT. Each FA2 contract represents a collection of wine bottles. Wine bottles are represented by tokens inside a FA2 contract.
When originating a collection of bottle,

- the creator must specify a collection name and a QR code for each bottle.
- the creator owns all bottles of the collection

The creator of the collection can also add new bottles to his collection anytime (with the _Mint_ entrypoint)

A bottle owner can transfer one or more bottle to someone else (with the _Transfer_ entrypoint)

A collection of bottles is represented by a FA2 contract. The implementation of the FA2 introduces:

- a admin address on the storage which represents the creator of the FA2 contract
- a _Mint_ entrypoint that allows the creator of the FA2 to create new tokens inside the NFT contract
- a _token_usage_ map that count the number of transfer of a bottle
- a _token_usage_ view for retrieving the number of transfer of a bottle (for a given token_id)

![](assets/wine_factory.png)

An extra Marketplace smart contract has been provided to illustrate how to make a secondary market on these Nft. The Marketplace contract allows Nft owners to sell their wine bottles on a secondary market. The Marketplace contract allows users to accept a sell proposal.
The Marketplace smart contract is not meant for production purpose.

## Pre-requisites

You need to install the following tools:

- [NodeJS & Npm](https://nodejs.org/en/download/)
- [LIGO](https://ligolang.org/docs/intro/installation/) **or** [Docker](https://docs.docker.com/get-docker/)

## How to use this template ?

### Compilation

A makefile is provided to compile the "Factory" smart contract.

\`\`\`
make compile
\`\`\`

You can also override \`make\` parameters by running :

\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

### Tests

A makefile is provided to launch tests.

\`\`\`
make test
\`\`\`

### Deployment

A typescript script for deployment is provided to originate the smart contrat. This deployment script relies on .env file which provides the RPC node url and the deployer public and private key.
So make sure to rename \`deploy/.env.dist\` to \`deploy/.env\` and **fill the required variables**.

\`\`\`
make deploy
\`\`\`
`,
  mainFile: `#import "storage.mligo" "Storage"
#import "parameter.mligo" "Parameter"
#import "generic_fa2/core/instance/NFT.mligo" "NFT_FA2"

type storage = Storage.t
type parameter = Parameter.t
type return = operation list * storage

type store = NFT_FA2.Storage.t
type ext = NFT_FA2.extension
type ext_storage = ext store

type lambda_create_contract = (key_hash option * tez * ext_storage) -> (operation * address) 
type fa2_main = (NFT_FA2.parameter * ext_storage) -> (operation list * ext_storage)

let generateCollection(param, store : Parameter.generate_collection_param * Storage.t) : return = 
    // create new collection
    let token_ids = param.token_ids in
    let sender = Tezos.get_sender () in
    let ledger = (Big_map.empty : NFT_FA2.Storage.Ledger.t) in
    let myfunc(acc, elt : NFT_FA2.Storage.Ledger.t * nat) : NFT_FA2.Storage.Ledger.t = Big_map.add elt sender acc in
    let new_ledger : NFT_FA2.Storage.Ledger.t = List.fold myfunc token_ids ledger in

    let token_usage = (Big_map.empty : NFT_FA2.TokenUsage.t) in
    let initial_usage(acc, elt : NFT_FA2.TokenUsage.t * nat) : NFT_FA2.TokenUsage.t = Big_map.add elt 0n acc in
    let new_token_usage = List.fold initial_usage token_ids token_usage in

    let token_metadata = param.token_metas in
    let operators = (Big_map.empty : NFT_FA2.Storage.Operators.t) in
    

    let initial_storage : ext_storage = {
        ledger=new_ledger;
        operators=operators;
        token_ids=token_ids;
        token_metadata=token_metadata;
        extension = {
          admin=sender;
          token_usage=new_token_usage;
        }
    }  in 

    let initial_delegate : key_hash option = (None: key_hash option) in
    let initial_amount : tez = 1tez in
    let create_my_contract : lambda_create_contract =
      [%Michelson ( {| { 
            UNPAIR ;
            UNPAIR ;
            CREATE_CONTRACT 
#include "generic_fa2/compiled/fa2_nft.tz"  
               ;
            PAIR } |}
              : lambda_create_contract)]
    in
    let originate : operation * address = create_my_contract(initial_delegate, initial_amount, initial_storage) in
    // insert into collections
    let new_all_collections = Big_map.add originate.1 sender store.all_collections in
    // insert into owned_collections
    let new_owned_collections = match Big_map.find_opt sender store.owned_collections with
    | None -> Big_map.add sender ([originate.1]: address list) store.owned_collections
    | Some addr_lst -> Big_map.update sender (Some(originate.1 :: addr_lst)) store.owned_collections
    in
    ([originate.0], { store with all_collections=new_all_collections; owned_collections=new_owned_collections})


let main(ep, store : parameter * storage) : return =
    match ep with 
    | GenerateCollection(p) -> generateCollection(p, store)
    | Nothing -> (([] : operation list), store)
`,
};

const nftFactoryJsligo: Template = {
  name: "NFT-Factory-JsLIGO",
  category: "token",
  repository: "https://github.com/ligolang/NFT-factory-jsligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "Exemple of a NFT Factory contract in JsLIGO Resources",
  readme: `## Contract VIN (Vinus In Numeris)

This contract implements a factory of FA2 NFT. Each FA2 contract represents a collection of wine bottles. Wine bottles are represented by tokens inside a FA2 contract.
When originating a collection of bottle,

- the creator must specify a collection name and a QR code for each bottle.
- the creator owns all bottles of the collection

The creator of the collection can also add new bottles to his collection anytime (with the _Mint_ entrypoint)

A bottle owner can transfer one or more bottle to someone else (with the _Transfer_ entrypoint)

A collection of bottles is represented by a FA2 contract. The implementation of the FA2 introduces:

- a admin address on the storage which represents the creator of the FA2 contract
- a _Mint_ entrypoint that allows the creator of the FA2 to create new tokens inside the NFT contract
- a _token_usage_ map that count the number of transfer of a bottle
- a _token_usage_ view for retrieving the number of transfer of a bottle (for a given token_id)

![](assets/wine_factory.png)

## Pre-requisites

You need to install the following tools:

- [NodeJS & Npm](https://nodejs.org/en/download/)
- [LIGO](https://ligolang.org/docs/intro/installation/) **or** [Docker](https://docs.docker.com/get-docker/)

## How to use this template ?

### Compilation

A makefile is provided to compile the "Factory" smart contract.

\`\`\`
make compile
\`\`\`

You can also override \`make\` parameters by running :

\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

### Tests

A makefile is provided to launch tests.

\`\`\`
make test
\`\`\`

### Deployment

A typescript script for deployment is provided to originate the smart contrat. This deployment script relies on .env file which provides the RPC node url and the deployer public and private key.
So make sure to rename \`deploy/.env.dist\` to \`deploy/.env\` and **fill the required variables**.

\`\`\`
make deploy
\`\`\`
`,
  mainFile: `#import "storage.jsligo" "Storage"
#import "parameter.jsligo" "Parameter"
#import "generic_fa2/core/instance/NFT.mligo" "NFT_FA2"

export type storage = Storage.t;
export type parameter = Parameter.t;
export type return_ = [list<operation>, storage];

type store = NFT_FA2.Storage.t;
type ext = NFT_FA2.extension;
type extStorage = store<ext>;

const generateCollection = ([param, store] : [Parameter.generateCollectionParam, Storage.t]) : return_ => {
    // create new collection
    let tokenIds = param.tokenIds;
    let ledger = (Big_map.empty as NFT_FA2.Storage.Ledger.t);
    let myfunc = ([acc, elt] : [NFT_FA2.Storage.Ledger.t, nat]) : NFT_FA2.Storage.Ledger.t => Big_map.add(elt, Tezos.get_sender (), acc);
    let newLedger : NFT_FA2.Storage.Ledger.t = List.fold(myfunc, tokenIds, ledger);

    let tokenUsage = (Big_map.empty as NFT_FA2.TokenUsage.t);
    let initialUsage = ([acc, elt] : [NFT_FA2.TokenUsage.t, nat]) : NFT_FA2.TokenUsage.t => Big_map.add(elt, (0 as nat), acc);
    let newTokenUsage = List.fold(initialUsage, tokenIds, tokenUsage);

    let tokenMetadata = param.tokenMetas;
    let operators = (Big_map.empty as NFT_FA2.Storage.Operators.t);
    

    let initialStorage : extStorage = {
        ledger:newLedger,
        operators:operators,
        token_ids:tokenIds,
        token_metadata:tokenMetadata,
        extension : {
          admin:Tezos.get_sender (),
          token_usage:newTokenUsage,
        }
    };

    let initialDelegate : option<key_hash> = (None() as option<key_hash>);
    let initialAmount : tez = 1 as tez;
    let createMyContract = (p: [option<key_hash>, tez, extStorage]) : [operation, address] =>
      (Michelson \`{ 
            UNPAIR ;
            UNPAIR ;
            CREATE_CONTRACT 
#include "generic_fa2/compiled/fa2_nft.tz"  
               ;
            PAIR }\`
            as ((p: [option<key_hash>, tez, extStorage]) => [operation, address]) )(p)
   ;

    let originate : [operation, address] = createMyContract(initialDelegate, initialAmount, initialStorage);
    // insert into collections
    let newAllCollections = Big_map.add(originate[1], Tezos.get_sender (), store.allCollections);
    // insert into ownedCollections
    let newOwnedCollections = match(Big_map.find_opt(Tezos.get_sender (), store.ownedCollections), {
      None: () => Big_map.add( Tezos.get_sender (), (list([originate[1]]) as list<address>), store.ownedCollections),
      Some: (addrLst: list<address>) => Big_map.update( Tezos.get_sender (), (Some( list([originate[1], ...addrLst]) )), store.ownedCollections)
    });
    return [list([originate[0]]), { ...store, allCollections:newAllCollections, ownedCollections:newOwnedCollections}];
};

export const main = ([ep, store] : [parameter, storage]) : return_ => {
    match(ep, { 
      GenerateCollection: (p: Parameter.generateCollectionParam) => generateCollection(p, store),
      Nothing: () => [(list([]) as list<operation>), store]
    });
};`,
};

const data = {
  map: {
    [nftFactoryCameligo.name]: nftFactoryCameligo,
    [nftFactoryJsligo.name]: nftFactoryJsligo,
  },
  all: [nftFactoryCameligo, nftFactoryJsligo],
};

export default data;
