import { LoadFacebookUser } from '@/data/contracts/apis'
import { LoadUserAccountRepository, SaveUserFacebookRepository } from '@/data/contracts/repositories'
import { FacebookAuthService } from '@/data/services'
import { AuthenticatorError } from '@/domain/errors'

import { mock, MockProxy } from 'jest-mock-extended'
import { AccessToken, FacebookAccount } from '@/domain/models'
import { TokenGenerator } from '@/data/contracts/crypto'

jest.mock('@/domain/models/facebook-account')

describe('FacebookAuthService', () => {
    let facebookApi: MockProxy<LoadFacebookUser>
    let crypto: MockProxy<TokenGenerator>
    let userAccountRepository: MockProxy<LoadUserAccountRepository & SaveUserFacebookRepository>
    let sut: FacebookAuthService
    const token = 'any_token'

    beforeAll(() => {
        facebookApi = mock()
        facebookApi.loadUser.mockResolvedValue({
            email: 'any_email@facebook.com',
            name: 'any_fb_name',
            facebookId: 'any_fb_id'
        })

        userAccountRepository = mock()
        userAccountRepository.load.mockResolvedValue(undefined)
        userAccountRepository.saveWithFacebook.mockResolvedValue({ id: 'any_id' })

        crypto = mock()
        crypto.genToken.mockResolvedValue('any_access_token')
    })

    beforeEach(() => {
        sut = new FacebookAuthService(
            facebookApi,
            userAccountRepository,
            crypto
        )
    })

    it('should call LoadFacebookUser with correct params', async () => {
        await sut.execute({ token })

        expect(facebookApi.loadUser).toHaveBeenCalledWith({ token })
        expect(facebookApi.loadUser).toHaveBeenCalledTimes(1)
    })

    it('should return AuthenticatiorError if LoadFacebookUser returns undefined', async () => {
        facebookApi.loadUser.mockResolvedValueOnce(undefined)

        const result = await sut.execute({ token })

        expect(result).toEqual(new AuthenticatorError())
    })

    it('should call UserAccountRepository if LoadFacebookUser returns data', async () => {
        await sut.execute({ token })

        expect(userAccountRepository.load).toHaveBeenCalledWith({ email: 'any_email@facebook.com' })
        expect(userAccountRepository.load).toHaveBeenCalledTimes(1)
    })

    it('should call SaveUserFacebookRepository with facebook account', async () => {
        const facebookAccountStub = jest.fn().mockImplementation(() => ({ any: 'any' }))
        jest.mocked(FacebookAccount).mockImplementation(facebookAccountStub)

        await sut.execute({ token })

        expect(userAccountRepository.saveWithFacebook).toHaveBeenCalledWith({ any: 'any' })
        expect(userAccountRepository.saveWithFacebook).toHaveBeenCalledTimes(1)
    })

    it('should call TokenGenerator with correct values', async () => {
        await sut.execute({ token })

        expect(crypto.genToken).toHaveBeenCalledWith({
            key: 'any_id',
            expiresInMs: AccessToken.expiresInMs
        })
        expect(crypto.genToken).toHaveBeenCalledTimes(1)
    })

    it('should return a AccessToken on success', async () => {
        const accessToken = await sut.execute({ token })

        expect(accessToken).toEqual(new AccessToken('any_access_token'))
    })

    it('should throw if LoadFacebookUser throws', async () => {
        facebookApi.loadUser.mockRejectedValueOnce(new Error('server error'))

        const result = sut.execute({ token })

        await expect(result).rejects.toThrow(new Error('server error'))
    })

    it('should throw if LoadUserAccountRepository throws', async () => {
        userAccountRepository.load.mockRejectedValueOnce(new Error('server error'))

        const result = sut.execute({ token })

        await expect(result).rejects.toThrow(new Error('server error'))
    })

    it('should throw if SaveUserFacebookRepository throws', async () => {
        userAccountRepository.saveWithFacebook.mockRejectedValueOnce(new Error('server error'))

        const result = sut.execute({ token })

        await expect(result).rejects.toThrow(new Error('server error'))
    })

    it('should throw if TokenGenerator throws', async () => {
        crypto.genToken.mockRejectedValueOnce(new Error('server error'))

        const result = sut.execute({ token })

        await expect(result).rejects.toThrow(new Error('server error'))
    })
})
