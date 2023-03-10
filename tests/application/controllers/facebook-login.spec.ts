import { FacebookLoginController } from '@/application/controllers'
import { RequiredInputError, ServerError, UnauthorizedError } from '@/application/errors'
import { AuthenticatorError } from '@/domain/errors'
import { FacebookAuth } from '@/domain/features'
import { AccessToken } from '@/domain/models'

import { MockProxy, mock } from 'jest-mock-extended'

describe('FacebookAuthController', () => {
    let facebookAuth: MockProxy<FacebookAuth>
    let sut: FacebookLoginController

    beforeAll(() => {
        facebookAuth = mock()
        facebookAuth.execute.mockResolvedValue(new AccessToken('any_key'))
    })

    beforeEach(() => {
        sut = new FacebookLoginController(facebookAuth)
    })

    it('should return 400 if token is empty', async () => {
        const httpResponse = await sut.handle({ token: '' })

        expect(httpResponse).toEqual({
            statusCode: 400,
            data: new RequiredInputError('token')
        })
    })

    it('should return 400 if token is null', async () => {
        const httpResponse = await sut.handle({ token: null as any })

        expect(httpResponse).toEqual({
            statusCode: 400,
            data: new RequiredInputError('token')
        })
    })

    it('should return 400 if token is undefined', async () => {
        const httpResponse = await sut.handle({ token: undefined as any })

        expect(httpResponse).toEqual({
            statusCode: 400,
            data: new RequiredInputError('token')
        })
    })

    it('should call FacebookAuth with correct params', async () => {
        await sut.handle({ token: 'any_token' })

        expect(facebookAuth.execute).toHaveBeenCalledWith({ token: 'any_token' })
    })

    it('should return 401 if authenticator fails', async () => {
        facebookAuth.execute.mockResolvedValueOnce(new AuthenticatorError())

        const httpResponse = await sut.handle({ token: 'any_token' })

        expect(httpResponse).toEqual({
            statusCode: 401,
            data: new UnauthorizedError()
        })
    })

    it('should return 200 if authenticator succeds', async () => {
        const httpResponse = await sut.handle({ token: 'any_token' })

        expect(httpResponse).toEqual({
            statusCode: 200,
            data: {
                accessToken: 'any_key'
            }
        })
    })

    it('should return 500 if authenticator throws', async () => {
        facebookAuth.execute.mockRejectedValueOnce(new Error('server error'))

        const httpResponse = await sut.handle({ token: 'any_token' })

        expect(httpResponse).toEqual({
            statusCode: 500,
            data: new ServerError(new Error('server error'))
        })
    })
})
