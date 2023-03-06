import { AxiosHttpClient } from '@/infra/http/axios-client'

import axios from 'axios'

jest.mock('axios')

describe('AxiosHttpClient', () => {
    let mockAxios: jest.Mocked<typeof axios>
    let sut: AxiosHttpClient
    const url: string = 'any_url'
    const params: object = { any: 'any' }

    beforeAll(() => {
        mockAxios = axios as jest.Mocked<typeof axios>
    })

    beforeEach(() => {
        sut = new AxiosHttpClient()
    })

    it('should call get with correct params', async () => {
        await sut.get({ url, params })

        expect(mockAxios.get).toHaveBeenCalledWith('any_url', { params: { any: 'any' } })
    })
})