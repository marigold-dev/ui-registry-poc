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

The creator of the collection can also add new bottles to his collection anytime (with the *Mint* entrypoint)

A bottle owner can transfer one or more bottle to someone else (with the *Transfer* entrypoint)


A collection of bottles is represented by a FA2 contract. The implementation of the FA2 introduces:
- a admin address on the storage which represents the creator of the FA2 contract
- a *Mint* entrypoint that allows the creator of the FA2 to create new tokens inside the NFT contract
- a *token_usage* map that count the number of transfer of a bottle
- a *token_usage* view for retrieving the number of transfer of a bottle (for a given token_id)

![](wine_factory.png)


An extra Marketplace smart contract has been provided to illustrate how to make a secondary market on these Nft. The Marketplace contract allows Nft owners to sell their wine bottles on a secondary market. The Marketplace contract allows users to accept a sell proposal.
The Marketplace smart contract is not meant for production purpose.

### Compilation

A makefile is provided to compile the "Factory" smart contract, and to launch tests.
\`\`\`
cd src/cameligo/
make compile
make test
\`\`\`

You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

### Tests

A makefile is provided to launch tests.
\`\`\`
cd src/cameligo/
make test
\`\`\`

### Deployment

A typescript script for deployment is provided to originate the smart contrat. This deployment script relies on .env file which provides the RPC node url and the deployer public and private key.

\`\`\`
cd src/cameligo
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
  michelson: [
    `{ parameter
    (or (pair %generateCollection
           (pair (string %name) (list %token_ids nat))
           (big_map %token_metas nat (pair (nat %token_id) (map %token_info string bytes))))
        (unit %nothing)) ;
  storage
    (pair (pair (big_map %all_collections address address) (big_map %metadata string bytes))
          (big_map %owned_collections address (list address))) ;
  code { UNPAIR ;
         IF_LEFT
           { DUP ;
             CAR ;
             CDR ;
             SENDER ;
             EMPTY_BIG_MAP nat address ;
             DUP 3 ;
             ITER { SWAP ; DUP 3 ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE } ;
             EMPTY_BIG_MAP nat nat ;
             DUP 4 ;
             ITER { SWAP ; PUSH nat 0 ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE } ;
             DIG 4 ;
             CDR ;
             DIG 4 ;
             EMPTY_BIG_MAP (pair address address) (set nat) ;
             PAIR ;
             DIG 3 ;
             DIG 3 ;
             DUP 5 ;
             PAIR ;
             PAIR ;
             PAIR ;
             PAIR ;
             PUSH mutez 1000000 ;
             NONE key_hash ;
             CREATE_CONTRACT
               { parameter
                   (or (list %transfer
                          (pair (address %from_) (list %tx (pair (address %to_) (nat %token_id)))))
                       (or (pair %balance_of
                              (list %requests (pair (address %owner) (nat %token_id)))
                              (contract %callback
                                 (list (pair (pair %request (address %owner) (nat %token_id)) (nat %balance)))))
                           (or (list %update_operators
                                  (or (pair %add_operator (address %owner) (address %operator) (nat %token_id))
                                      (pair %remove_operator (address %owner) (address %operator) (nat %token_id))))
                               (pair %mint (list %ids nat) (big_map %metas nat (map string bytes)))))) ;
                 storage
                   (pair (pair (pair (pair %extension (address %admin) (big_map %token_usage nat nat))
                                     (big_map %ledger nat address))
                               (big_map %operators (pair address address) (set nat))
                               (list %token_ids nat))
                         (big_map %token_metadata nat (pair (nat %token_id) (map %token_info string bytes)))) ;
                 code { LAMBDA (pair address address) bool { UNPAIR ; COMPARE ; EQ } ;
                        PUSH string "FA2_TOKEN_UNDEFINED" ;
                        LAMBDA
                          (pair (lambda (pair address address) bool) (pair (big_map nat address) nat address))
                          bool
                          { UNPAIR ;
                            SWAP ;
                            UNPAIR 3 ;
                            SWAP ;
                            GET ;
                            IF_NONE { PUSH string "option is None" ; FAILWITH } {} ;
                            PAIR ;
                            EXEC } ;
                        DUP 3 ;
                        APPLY ;
                        LAMBDA
                          (pair (lambda (pair address address) bool) address)
                          unit
                          { UNPAIR ;
                            SWAP ;
                            SENDER ;
                            SWAP ;
                            PAIR ;
                            EXEC ;
                            IF { UNIT }
                               { PUSH string "The sender can only manage operators for his own token" ;
                                 FAILWITH } } ;
                        DUP 4 ;
                        APPLY ;
                        DIG 4 ;
                        UNPAIR ;
                        IF_LEFT
                          { DIG 2 ;
                            DROP ;
                            DUP 2 ;
                            CAR ;
                            CAR ;
                            CDR ;
                            DUP 2 ;
                            ITER { UNPAIR ;
                                   DUG 2 ;
                                   ITER { UNPAIR ;
                                          DUP 6 ;
                                          CDR ;
                                          DUP 3 ;
                                          GET ;
                                          IF_NONE { DUP 8 ; FAILWITH } { DROP } ;
                                          SENDER ;
                                          DUP 5 ;
                                          DUP 2 ;
                                          PAIR ;
                                          DUP 11 ;
                                          SWAP ;
                                          EXEC ;
                                          IF { DROP }
                                             { DUP 7 ;
                                               CAR ;
                                               CDR ;
                                               CAR ;
                                               SWAP ;
                                               DUP 6 ;
                                               PAIR ;
                                               GET ;
                                               IF_NONE { EMPTY_SET nat } {} ;
                                               DUP 3 ;
                                               MEM ;
                                               IF {} { PUSH string "FA2_NOT_OPERATOR" ; FAILWITH } } ;
                                          DUP 4 ;
                                          DUP 3 ;
                                          DUP 5 ;
                                          PAIR 3 ;
                                          DUP 8 ;
                                          SWAP ;
                                          EXEC ;
                                          IF {} { PUSH string "FA2_INSUFFICIENT_BALANCE" ; FAILWITH } ;
                                          DIG 2 ;
                                          SWAP ;
                                          SOME ;
                                          DIG 2 ;
                                          UPDATE } ;
                                   SWAP ;
                                   DROP } ;
                            DIG 3 ;
                            DIG 4 ;
                            DIG 5 ;
                            DROP 3 ;
                            DUP 3 ;
                            CDR ;
                            DUP 4 ;
                            CAR ;
                            CDR ;
                            DIG 2 ;
                            DIG 4 ;
                            CAR ;
                            CAR ;
                            CAR ;
                            PAIR ;
                            PAIR ;
                            PAIR ;
                            DUP ;
                            CAR ;
                            CAR ;
                            CAR ;
                            CDR ;
                            DIG 2 ;
                            ITER { CDR ;
                                   ITER { CDR ;
                                          DUP 2 ;
                                          DUP 2 ;
                                          GET ;
                                          IF_NONE
                                            { DROP 2 ;
                                              PUSH string "This token is not initialized in usage map" ;
                                              FAILWITH }
                                            { DIG 2 ; PUSH nat 1 ; DIG 2 ; ADD ; SOME ; DIG 2 ; UPDATE } } } ;
                            NIL operation ;
                            NIL operation ;
                            ITER { CONS } ;
                            DUP 3 ;
                            CDR ;
                            DUP 4 ;
                            CAR ;
                            CDR ;
                            DUP 5 ;
                            CAR ;
                            CAR ;
                            CDR ;
                            DIG 4 ;
                            DIG 5 ;
                            CAR ;
                            CAR ;
                            CAR ;
                            CAR ;
                            PAIR ;
                            PAIR ;
                            PAIR ;
                            PAIR ;
                            SWAP }
                          { DIG 5 ;
                            DROP ;
                            IF_LEFT
                              { DIG 2 ;
                                DROP ;
                                UNPAIR ;
                                MAP { DUP ;
                                      UNPAIR ;
                                      DUP 5 ;
                                      CDR ;
                                      DUP 3 ;
                                      GET ;
                                      IF_NONE { DUP 7 ; FAILWITH } { DROP } ;
                                      SWAP ;
                                      DUP 5 ;
                                      CAR ;
                                      CAR ;
                                      CDR ;
                                      PAIR 3 ;
                                      DUP 5 ;
                                      SWAP ;
                                      EXEC ;
                                      IF { PUSH nat 1 } { PUSH nat 0 } ;
                                      SWAP ;
                                      PAIR } ;
                                DIG 3 ;
                                DIG 4 ;
                                DROP 2 ;
                                SWAP ;
                                PUSH mutez 0 ;
                                DIG 2 ;
                                TRANSFER_TOKENS ;
                                SWAP ;
                                NIL operation ;
                                DIG 2 ;
                                CONS }
                              { DIG 3 ;
                                DIG 4 ;
                                DROP 2 ;
                                IF_LEFT
                                  { DUP 2 ;
                                    CAR ;
                                    CDR ;
                                    CAR ;
                                    SWAP ;
                                    ITER { IF_LEFT
                                             { UNPAIR 3 ;
                                               DUP 2 ;
                                               DUP 2 ;
                                               COMPARE ;
                                               EQ ;
                                               IF { DROP 3 }
                                                  { DUP ;
                                                    DUP 7 ;
                                                    SWAP ;
                                                    EXEC ;
                                                    DROP ;
                                                    DUP 4 ;
                                                    DIG 4 ;
                                                    DUP 4 ;
                                                    DUP 4 ;
                                                    PAIR ;
                                                    GET ;
                                                    IF_NONE { EMPTY_SET nat } {} ;
                                                    DIG 4 ;
                                                    PUSH bool True ;
                                                    SWAP ;
                                                    UPDATE ;
                                                    SOME ;
                                                    DIG 3 ;
                                                    DIG 3 ;
                                                    PAIR ;
                                                    UPDATE } }
                                             { UNPAIR 3 ;
                                               DUP 2 ;
                                               DUP 2 ;
                                               COMPARE ;
                                               EQ ;
                                               IF { DROP 3 }
                                                  { DUP ;
                                                    DUP 7 ;
                                                    SWAP ;
                                                    EXEC ;
                                                    DROP ;
                                                    DUP 4 ;
                                                    DIG 4 ;
                                                    DUP 4 ;
                                                    DUP 4 ;
                                                    PAIR ;
                                                    GET ;
                                                    IF_NONE
                                                      { DIG 3 ; DROP ; NONE (set nat) }
                                                      { DIG 4 ;
                                                        PUSH bool False ;
                                                        SWAP ;
                                                        UPDATE ;
                                                        PUSH nat 0 ;
                                                        DUP 2 ;
                                                        SIZE ;
                                                        COMPARE ;
                                                        EQ ;
                                                        IF { DROP ; NONE (set nat) } { SOME } } ;
                                                    DIG 3 ;
                                                    DIG 3 ;
                                                    PAIR ;
                                                    UPDATE } } } ;
                                    DIG 2 ;
                                    DROP ;
                                    DUP 2 ;
                                    CDR ;
                                    DUP 3 ;
                                    CAR ;
                                    CDR ;
                                    CDR ;
                                    DIG 2 ;
                                    PAIR ;
                                    DIG 2 ;
                                    CAR ;
                                    CAR ;
                                    PAIR }
                                  { DIG 2 ;
                                    DROP ;
                                    DUP 2 ;
                                    CAR ;
                                    CAR ;
                                    CAR ;
                                    CAR ;
                                    SENDER ;
                                    COMPARE ;
                                    EQ ;
                                    IF {} { PUSH string "FA2_NOT_ADMIN" ; FAILWITH } ;
                                    DUP 2 ;
                                    CAR ;
                                    CDR ;
                                    CDR ;
                                    DUP 2 ;
                                    CAR ;
                                    ITER { CONS } ;
                                    DUP 3 ;
                                    CAR ;
                                    CAR ;
                                    CDR ;
                                    DUP 3 ;
                                    CAR ;
                                    ITER { SWAP ; SENDER ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE } ;
                                    DUP 3 ;
                                    CDR ;
                                    DUP 5 ;
                                    CDR ;
                                    PAIR ;
                                    DIG 3 ;
                                    CAR ;
                                    ITER { SWAP ;
                                           DUP ;
                                           CDR ;
                                           DUP 3 ;
                                           GET ;
                                           IF_NONE { PUSH string "Missing token_info" ; FAILWITH } {} ;
                                           DUP 2 ;
                                           CDR ;
                                           DIG 2 ;
                                           CAR ;
                                           DIG 2 ;
                                           DUP 4 ;
                                           PAIR ;
                                           DIG 3 ;
                                           SWAP ;
                                           SOME ;
                                           SWAP ;
                                           UPDATE ;
                                           PAIR } ;
                                    CAR ;
                                    DUP 4 ;
                                    CDR ;
                                    DIG 3 ;
                                    DUP 5 ;
                                    CAR ;
                                    CDR ;
                                    CAR ;
                                    PAIR ;
                                    DIG 4 ;
                                    CAR ;
                                    CAR ;
                                    PAIR ;
                                    PAIR ;
                                    DUP ;
                                    CDR ;
                                    DUP 2 ;
                                    CAR ;
                                    CDR ;
                                    DIG 4 ;
                                    DIG 3 ;
                                    CAR ;
                                    CAR ;
                                    CAR ;
                                    PAIR ;
                                    PAIR ;
                                    SWAP ;
                                    DROP } ;
                                PAIR ;
                                NIL operation } } ;
                        PAIR } ;
                 view "token_usage"
                      nat
                      nat
                      { UNPAIR ;
                        SWAP ;
                        CAR ;
                        CAR ;
                        CAR ;
                        CDR ;
                        SWAP ;
                        GET ;
                        IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } {} } ;
                 view "get_balance"
                      (pair address nat)
                      nat
                      { UNPAIR ;
                        UNPAIR ;
                        DUP 3 ;
                        CDR ;
                        DUP 3 ;
                        GET ;
                        IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } { DROP } ;
                        DIG 2 ;
                        CAR ;
                        CAR ;
                        CDR ;
                        DIG 2 ;
                        GET ;
                        IF_NONE { PUSH string "option is None" ; FAILWITH } {} ;
                        COMPARE ;
                        EQ ;
                        IF { PUSH nat 1 } { PUSH nat 0 } } ;
                 view "total_supply"
                      nat
                      nat
                      { UNPAIR ;
                        SWAP ;
                        CDR ;
                        SWAP ;
                        GET ;
                        IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } { DROP } ;
                        PUSH nat 1 } ;
                 view "all_tokens" unit (list nat) { CDR ; CAR ; CDR ; CDR } ;
                 view "is_operator"
                      (pair (address %owner) (address %operator) (nat %token_id))
                      bool
                      { UNPAIR ;
                        DUP ;
                        CAR ;
                        DUP 2 ;
                        GET 3 ;
                        DIG 3 ;
                        CAR ;
                        CDR ;
                        CAR ;
                        DUP 2 ;
                        DUP 4 ;
                        PAIR ;
                        GET ;
                        IF_NONE { EMPTY_SET nat } {} ;
                        DIG 3 ;
                        GET 4 ;
                        MEM ;
                        SWAP ;
                        DIG 2 ;
                        COMPARE ;
                        EQ ;
                        OR } ;
                 view "token_metadata"
                      nat
                      (pair (nat %token_id) (map %token_info string bytes))
                      { UNPAIR ;
                        SWAP ;
                        CDR ;
                        SWAP ;
                        GET ;
                        IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } {} } } ;
             PAIR ;
             DUP 3 ;
             CDR ;
             DUP 3 ;
             GET ;
             IF_NONE
               { DUP 3 ;
                 CDR ;
                 NIL address ;
                 DUP 3 ;
                 CDR ;
                 CONS ;
                 DUP 4 ;
                 SWAP ;
                 SOME ;
                 SWAP ;
                 UPDATE }
               { DUP 4 ; CDR ; SWAP ; DUP 3 ; CDR ; CONS ; SOME ; DUP 4 ; UPDATE } ;
             DUP 4 ;
             CAR ;
             CDR ;
             DIG 4 ;
             CAR ;
             CAR ;
             DIG 4 ;
             DUP 5 ;
             CDR ;
             SWAP ;
             SOME ;
             SWAP ;
             UPDATE ;
             PAIR ;
             PAIR ;
             NIL operation ;
             DIG 2 ;
             CAR ;
             CONS }
           { DROP ; NIL operation } ;
         PAIR } }

`,
  ],
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

The creator of the collection can also add new bottles to his collection anytime (with the *Mint* entrypoint)

A bottle owner can transfer one or more bottle to someone else (with the *Transfer* entrypoint)


A collection of bottles is represented by a FA2 contract. The implementation of the FA2 introduces:
- a admin address on the storage which represents the creator of the FA2 contract
- a *Mint* entrypoint that allows the creator of the FA2 to create new tokens inside the NFT contract
- a *token_usage* map that count the number of transfer of a bottle
- a *token_usage* view for retrieving the number of transfer of a bottle (for a given token_id)

![](wine_factory.png)


An extra Marketplace smart contract has been provided to illustrate how to make a secondary market on these Nft. The Marketplace contract allows Nft owners to sell their wine bottles on a secondary market. The Marketplace contract allows users to accept a sell proposal.
The Marketplace smart contract is not meant for production purpose.

### Compilation

A makefile is provided to compile the "Factory" smart contract, and to launch tests.
\`\`\`
cd src/cameligo/
make compile
make test
\`\`\`

You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

### Tests

A makefile is provided to launch tests.
\`\`\`
cd src/cameligo/
make test
\`\`\`

### Deployment

A typescript script for deployment is provided to originate the smart contrat. This deployment script relies on .env file which provides the RPC node url and the deployer public and private key.

\`\`\`
cd src/cameligo
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
  michelson: [
    `{ parameter
    (or (pair %generateCollection
           (pair (string %name) (list %tokenIds nat))
           (big_map %tokenMetas nat (pair (nat %token_id) (map %token_info string bytes))))
        (unit %nothing)) ;
  storage
    (pair (pair (big_map %allCollections address address) (big_map %metadata string bytes))
          (big_map %ownedCollections address (list address))) ;
  code { UNPAIR ;
         IF_LEFT
           { DUP ;
             CAR ;
             CDR ;
             EMPTY_BIG_MAP nat address ;
             LAMBDA
               (pair (big_map nat address) nat)
               (big_map nat address)
               { UNPAIR ; SENDER ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE } ;
             SWAP ;
             DUP 3 ;
             ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
             SWAP ;
             DROP ;
             EMPTY_BIG_MAP nat nat ;
             LAMBDA
               (pair (big_map nat nat) nat)
               (big_map nat nat)
               { UNPAIR ; PUSH nat 0 ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE } ;
             SWAP ;
             DUP 4 ;
             ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
             SWAP ;
             DROP ;
             DIG 3 ;
             CDR ;
             EMPTY_BIG_MAP (pair address address) (set nat) ;
             SWAP ;
             DIG 4 ;
             DIG 2 ;
             PAIR ;
             DIG 3 ;
             DIG 3 ;
             SENDER ;
             PAIR ;
             PAIR ;
             PAIR ;
             PAIR ;
             NONE key_hash ;
             PUSH mutez 1000000 ;
             LAMBDA
               (pair (pair (option key_hash) mutez)
                     (pair (pair (pair address (big_map nat nat)) (big_map nat address))
                           (big_map (pair address address) (set nat))
                           (list nat))
                     (big_map nat (pair nat (map string bytes))))
               (pair operation address)
               { UNPAIR ;
                 UNPAIR ;
                 CREATE_CONTRACT
                   { parameter
                       (or (list %transfer
                              (pair (address %from_) (list %tx (pair (address %to_) (nat %token_id)))))
                           (or (pair %balance_of
                                  (list %requests (pair (address %owner) (nat %token_id)))
                                  (contract %callback
                                     (list (pair (pair %request (address %owner) (nat %token_id)) (nat %balance)))))
                               (or (list %update_operators
                                      (or (pair %add_operator (address %owner) (address %operator) (nat %token_id))
                                          (pair %remove_operator (address %owner) (address %operator) (nat %token_id))))
                                   (pair %mint (list %ids nat) (big_map %metas nat (map string bytes)))))) ;
                     storage
                       (pair (pair (pair (pair %extension (address %admin) (big_map %token_usage nat nat))
                                         (big_map %ledger nat address))
                                   (big_map %operators (pair address address) (set nat))
                                   (list %token_ids nat))
                             (big_map %token_metadata nat (pair (nat %token_id) (map %token_info string bytes)))) ;
                     code { LAMBDA (pair address address) bool { UNPAIR ; COMPARE ; EQ } ;
                            PUSH string "FA2_TOKEN_UNDEFINED" ;
                            LAMBDA
                              (pair (lambda (pair address address) bool) (pair (big_map nat address) nat address))
                              bool
                              { UNPAIR ;
                                SWAP ;
                                UNPAIR 3 ;
                                SWAP ;
                                GET ;
                                IF_NONE { PUSH string "option is None" ; FAILWITH } {} ;
                                PAIR ;
                                EXEC } ;
                            DUP 3 ;
                            APPLY ;
                            LAMBDA
                              (pair (lambda (pair address address) bool) address)
                              unit
                              { UNPAIR ;
                                SWAP ;
                                SENDER ;
                                SWAP ;
                                PAIR ;
                                EXEC ;
                                IF { UNIT }
                                   { PUSH string "The sender can only manage operators for his own token" ;
                                     FAILWITH } } ;
                            DUP 4 ;
                            APPLY ;
                            DIG 4 ;
                            UNPAIR ;
                            IF_LEFT
                              { DIG 2 ;
                                DROP ;
                                DUP 2 ;
                                CAR ;
                                CAR ;
                                CDR ;
                                DUP 2 ;
                                ITER { UNPAIR ;
                                       DUG 2 ;
                                       ITER { UNPAIR ;
                                              DUP 6 ;
                                              CDR ;
                                              DUP 3 ;
                                              GET ;
                                              IF_NONE { DUP 8 ; FAILWITH } { DROP } ;
                                              SENDER ;
                                              DUP 5 ;
                                              DUP 2 ;
                                              PAIR ;
                                              DUP 11 ;
                                              SWAP ;
                                              EXEC ;
                                              IF { DROP }
                                                 { DUP 7 ;
                                                   CAR ;
                                                   CDR ;
                                                   CAR ;
                                                   SWAP ;
                                                   DUP 6 ;
                                                   PAIR ;
                                                   GET ;
                                                   IF_NONE { EMPTY_SET nat } {} ;
                                                   DUP 3 ;
                                                   MEM ;
                                                   IF {} { PUSH string "FA2_NOT_OPERATOR" ; FAILWITH } } ;
                                              DUP 4 ;
                                              DUP 3 ;
                                              DUP 5 ;
                                              PAIR 3 ;
                                              DUP 8 ;
                                              SWAP ;
                                              EXEC ;
                                              IF {} { PUSH string "FA2_INSUFFICIENT_BALANCE" ; FAILWITH } ;
                                              DIG 2 ;
                                              SWAP ;
                                              SOME ;
                                              DIG 2 ;
                                              UPDATE } ;
                                       SWAP ;
                                       DROP } ;
                                DIG 3 ;
                                DIG 4 ;
                                DIG 5 ;
                                DROP 3 ;
                                DUP 3 ;
                                CDR ;
                                DUP 4 ;
                                CAR ;
                                CDR ;
                                DIG 2 ;
                                DIG 4 ;
                                CAR ;
                                CAR ;
                                CAR ;
                                PAIR ;
                                PAIR ;
                                PAIR ;
                                DUP ;
                                CAR ;
                                CAR ;
                                CAR ;
                                CDR ;
                                DIG 2 ;
                                ITER { CDR ;
                                       ITER { CDR ;
                                              DUP 2 ;
                                              DUP 2 ;
                                              GET ;
                                              IF_NONE
                                                { DROP 2 ;
                                                  PUSH string "This token is not initialized in usage map" ;
                                                  FAILWITH }
                                                { DIG 2 ; PUSH nat 1 ; DIG 2 ; ADD ; SOME ; DIG 2 ; UPDATE } } } ;
                                NIL operation ;
                                NIL operation ;
                                ITER { CONS } ;
                                DUP 3 ;
                                CDR ;
                                DUP 4 ;
                                CAR ;
                                CDR ;
                                DUP 5 ;
                                CAR ;
                                CAR ;
                                CDR ;
                                DIG 4 ;
                                DIG 5 ;
                                CAR ;
                                CAR ;
                                CAR ;
                                CAR ;
                                PAIR ;
                                PAIR ;
                                PAIR ;
                                PAIR ;
                                SWAP }
                              { DIG 5 ;
                                DROP ;
                                IF_LEFT
                                  { DIG 2 ;
                                    DROP ;
                                    UNPAIR ;
                                    MAP { DUP ;
                                          UNPAIR ;
                                          DUP 5 ;
                                          CDR ;
                                          DUP 3 ;
                                          GET ;
                                          IF_NONE { DUP 7 ; FAILWITH } { DROP } ;
                                          SWAP ;
                                          DUP 5 ;
                                          CAR ;
                                          CAR ;
                                          CDR ;
                                          PAIR 3 ;
                                          DUP 5 ;
                                          SWAP ;
                                          EXEC ;
                                          IF { PUSH nat 1 } { PUSH nat 0 } ;
                                          SWAP ;
                                          PAIR } ;
                                    DIG 3 ;
                                    DIG 4 ;
                                    DROP 2 ;
                                    SWAP ;
                                    PUSH mutez 0 ;
                                    DIG 2 ;
                                    TRANSFER_TOKENS ;
                                    SWAP ;
                                    NIL operation ;
                                    DIG 2 ;
                                    CONS }
                                  { DIG 3 ;
                                    DIG 4 ;
                                    DROP 2 ;
                                    IF_LEFT
                                      { DUP 2 ;
                                        CAR ;
                                        CDR ;
                                        CAR ;
                                        SWAP ;
                                        ITER { IF_LEFT
                                                 { UNPAIR 3 ;
                                                   DUP 2 ;
                                                   DUP 2 ;
                                                   COMPARE ;
                                                   EQ ;
                                                   IF { DROP 3 }
                                                      { DUP ;
                                                        DUP 7 ;
                                                        SWAP ;
                                                        EXEC ;
                                                        DROP ;
                                                        DUP 4 ;
                                                        DIG 4 ;
                                                        DUP 4 ;
                                                        DUP 4 ;
                                                        PAIR ;
                                                        GET ;
                                                        IF_NONE { EMPTY_SET nat } {} ;
                                                        DIG 4 ;
                                                        PUSH bool True ;
                                                        SWAP ;
                                                        UPDATE ;
                                                        SOME ;
                                                        DIG 3 ;
                                                        DIG 3 ;
                                                        PAIR ;
                                                        UPDATE } }
                                                 { UNPAIR 3 ;
                                                   DUP 2 ;
                                                   DUP 2 ;
                                                   COMPARE ;
                                                   EQ ;
                                                   IF { DROP 3 }
                                                      { DUP ;
                                                        DUP 7 ;
                                                        SWAP ;
                                                        EXEC ;
                                                        DROP ;
                                                        DUP 4 ;
                                                        DIG 4 ;
                                                        DUP 4 ;
                                                        DUP 4 ;
                                                        PAIR ;
                                                        GET ;
                                                        IF_NONE
                                                          { DIG 3 ; DROP ; NONE (set nat) }
                                                          { DIG 4 ;
                                                            PUSH bool False ;
                                                            SWAP ;
                                                            UPDATE ;
                                                            PUSH nat 0 ;
                                                            DUP 2 ;
                                                            SIZE ;
                                                            COMPARE ;
                                                            EQ ;
                                                            IF { DROP ; NONE (set nat) } { SOME } } ;
                                                        DIG 3 ;
                                                        DIG 3 ;
                                                        PAIR ;
                                                        UPDATE } } } ;
                                        DIG 2 ;
                                        DROP ;
                                        DUP 2 ;
                                        CDR ;
                                        DUP 3 ;
                                        CAR ;
                                        CDR ;
                                        CDR ;
                                        DIG 2 ;
                                        PAIR ;
                                        DIG 2 ;
                                        CAR ;
                                        CAR ;
                                        PAIR }
                                      { DIG 2 ;
                                        DROP ;
                                        DUP 2 ;
                                        CAR ;
                                        CAR ;
                                        CAR ;
                                        CAR ;
                                        SENDER ;
                                        COMPARE ;
                                        EQ ;
                                        IF {} { PUSH string "FA2_NOT_ADMIN" ; FAILWITH } ;
                                        DUP 2 ;
                                        CAR ;
                                        CDR ;
                                        CDR ;
                                        DUP 2 ;
                                        CAR ;
                                        ITER { CONS } ;
                                        DUP 3 ;
                                        CAR ;
                                        CAR ;
                                        CDR ;
                                        DUP 3 ;
                                        CAR ;
                                        ITER { SWAP ; SENDER ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE } ;
                                        DUP 3 ;
                                        CDR ;
                                        DUP 5 ;
                                        CDR ;
                                        PAIR ;
                                        DIG 3 ;
                                        CAR ;
                                        ITER { SWAP ;
                                               DUP ;
                                               CDR ;
                                               DUP 3 ;
                                               GET ;
                                               IF_NONE { PUSH string "Missing token_info" ; FAILWITH } {} ;
                                               DUP 2 ;
                                               CDR ;
                                               DIG 2 ;
                                               CAR ;
                                               DIG 2 ;
                                               DUP 4 ;
                                               PAIR ;
                                               DIG 3 ;
                                               SWAP ;
                                               SOME ;
                                               SWAP ;
                                               UPDATE ;
                                               PAIR } ;
                                        CAR ;
                                        DUP 4 ;
                                        CDR ;
                                        DIG 3 ;
                                        DUP 5 ;
                                        CAR ;
                                        CDR ;
                                        CAR ;
                                        PAIR ;
                                        DIG 4 ;
                                        CAR ;
                                        CAR ;
                                        PAIR ;
                                        PAIR ;
                                        DUP ;
                                        CDR ;
                                        DUP 2 ;
                                        CAR ;
                                        CDR ;
                                        DIG 4 ;
                                        DIG 3 ;
                                        CAR ;
                                        CAR ;
                                        CAR ;
                                        PAIR ;
                                        PAIR ;
                                        SWAP ;
                                        DROP } ;
                                    PAIR ;
                                    NIL operation } } ;
                            PAIR } ;
                     view "token_usage"
                          nat
                          nat
                          { UNPAIR ;
                            SWAP ;
                            CAR ;
                            CAR ;
                            CAR ;
                            CDR ;
                            SWAP ;
                            GET ;
                            IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } {} } ;
                     view "get_balance"
                          (pair address nat)
                          nat
                          { UNPAIR ;
                            UNPAIR ;
                            DUP 3 ;
                            CDR ;
                            DUP 3 ;
                            GET ;
                            IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } { DROP } ;
                            DIG 2 ;
                            CAR ;
                            CAR ;
                            CDR ;
                            DIG 2 ;
                            GET ;
                            IF_NONE { PUSH string "option is None" ; FAILWITH } {} ;
                            COMPARE ;
                            EQ ;
                            IF { PUSH nat 1 } { PUSH nat 0 } } ;
                     view "total_supply"
                          nat
                          nat
                          { UNPAIR ;
                            SWAP ;
                            CDR ;
                            SWAP ;
                            GET ;
                            IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } { DROP } ;
                            PUSH nat 1 } ;
                     view "all_tokens" unit (list nat) { CDR ; CAR ; CDR ; CDR } ;
                     view "is_operator"
                          (pair (address %owner) (address %operator) (nat %token_id))
                          bool
                          { UNPAIR ;
                            DUP ;
                            CAR ;
                            DUP 2 ;
                            GET 3 ;
                            DIG 3 ;
                            CAR ;
                            CDR ;
                            CAR ;
                            DUP 2 ;
                            DUP 4 ;
                            PAIR ;
                            GET ;
                            IF_NONE { EMPTY_SET nat } {} ;
                            DIG 3 ;
                            GET 4 ;
                            MEM ;
                            SWAP ;
                            DIG 2 ;
                            COMPARE ;
                            EQ ;
                            OR } ;
                     view "token_metadata"
                          nat
                          (pair (nat %token_id) (map %token_info string bytes))
                          { UNPAIR ;
                            SWAP ;
                            CDR ;
                            SWAP ;
                            GET ;
                            IF_NONE { PUSH string "FA2_TOKEN_UNDEFINED" ; FAILWITH } {} } } ;
                 PAIR } ;
             DIG 3 ;
             DIG 2 ;
             DIG 3 ;
             PAIR ;
             PAIR ;
             EXEC ;
             DUP 2 ;
             CAR ;
             CAR ;
             SENDER ;
             DUP 3 ;
             CDR ;
             SWAP ;
             SOME ;
             SWAP ;
             UPDATE ;
             DUP 3 ;
             CDR ;
             SENDER ;
             GET ;
             IF_NONE
               { DUP 3 ;
                 CDR ;
                 NIL address ;
                 DUP 4 ;
                 CDR ;
                 CONS ;
                 SENDER ;
                 SWAP ;
                 SOME ;
                 SWAP ;
                 UPDATE }
               { DUP 4 ; CDR ; SWAP ; DUP 4 ; CDR ; CONS ; SOME ; SENDER ; UPDATE } ;
             DUP 4 ;
             CDR ;
             DIG 4 ;
             CAR ;
             CDR ;
             DIG 3 ;
             PAIR ;
             SWAP ;
             DROP ;
             PAIR ;
             NIL operation ;
             DIG 2 ;
             CAR ;
             CONS }
           { DROP ; NIL operation } ;
         PAIR } }

`,
  ],
};

export default {
  map: {
    [nftFactoryCameligo.name]: nftFactoryCameligo,
    [nftFactoryJsligo.name]: nftFactoryJsligo,
  },
  all: [nftFactoryCameligo, nftFactoryJsligo],
};
