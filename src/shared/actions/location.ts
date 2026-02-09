'use server'

export async function searchLocations(query: string) {
    if (!query || query.length < 3) return []

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
            headers: {
                'User-Agent': 'VananbiMVP/1.0',
                'Referer': 'https://vananbi.com' // Optional but good practice
            }
        })

        if (!response.ok) {
            console.error('Nominatim API error:', response.statusText)
            return []
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Location search error:', error)
        return []
    }
}
