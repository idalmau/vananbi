import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createVanRecord, uploadVanPhoto } from './service'
import { SupabaseClient } from '@supabase/supabase-js'

describe('Vans Service', () => {
    let mockSupabase: any

    beforeEach(() => {
        // Mock a basic Supabase Client
        mockSupabase = {
            from: vi.fn(),
            storage: {
                from: vi.fn(),
            }
        }
    })

    describe('createVanRecord', () => {
        it('should successfully create a van record', async () => {
            const mockVanData = { make: 'Ford', model: 'Transit', year: 2020, license_plate: '1234 ABC' }
            const mockResponse = { id: 'van-123', ...mockVanData, status: 'pending', host_id: 'user-1' }
            
            // Build the mock chain: from().insert().select().single()
            const singleMock = vi.fn().mockResolvedValue({ data: mockResponse, error: null })
            const selectMock = vi.fn().mockReturnValue({ single: singleMock })
            const insertMock = vi.fn().mockReturnValue({ select: selectMock })
            mockSupabase.from.mockReturnValue({ insert: insertMock })

            const result = await createVanRecord(mockSupabase as unknown as SupabaseClient, 'user-1', mockVanData)

            expect(mockSupabase.from).toHaveBeenCalledWith('vans')
            expect(insertMock).toHaveBeenCalledWith({
                host_id: 'user-1',
                ...mockVanData,
                status: 'pending'
            })
            expect(result).toEqual(mockResponse)
        })

        it('should throw an error if database insert fails', async () => {
             const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
             const selectMock = vi.fn().mockReturnValue({ single: singleMock })
             const insertMock = vi.fn().mockReturnValue({ select: selectMock })
             mockSupabase.from.mockReturnValue({ insert: insertMock })

             await expect(createVanRecord(mockSupabase as unknown as SupabaseClient, 'user-1', { make: 'Ford', model: 'Transit', year: 2020, license_plate: '1234 ABC' }))
                .rejects.toThrow('Error al registrar el vehículo: DB Error')
        })
    })

    describe('uploadVanPhoto', () => {
        it('should return null if no file is provided', async () => {
            const result = await uploadVanPhoto(mockSupabase as unknown as SupabaseClient, 'van-123', undefined, 'front', 'van-photos')
            expect(result).toBeNull()
        })
    })
})
