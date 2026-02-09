export async function geocodeLocation(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const query = encodeURIComponent(address)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
            headers: {
                'User-Agent': 'VananbiMVP/1.0' // Nominatim requires a User-Agent
            }
        })

        if (!response.ok) {
            throw new Error('Geocoding failed')
        }

        const data = await response.json()

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            }
        }
    } catch (error) {
        console.error('Geocoding error:', error)
    }

    return null
}
