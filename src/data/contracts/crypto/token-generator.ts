export interface TokenGenerator {
    genToken: (params: TokenGenerator.Params) => Promise<TokenGenerator.Resolve>
}

export namespace TokenGenerator {
    export type Params = {
        key: string
        expirationInMs: number
    }

    export type Resolve = string
}
