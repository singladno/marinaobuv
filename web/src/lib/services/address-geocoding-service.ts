import { AddressSuggestion } from '@/hooks/useAddressAutocomplete';

interface GeocodingServiceConfig {
  baseUrl?: string;
  timeout?: number;
  rateLimitDelay?: number;
}

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

class ProductionAddressGeocodingService {
  private config: Required<GeocodingServiceConfig>;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;

  constructor(config: GeocodingServiceConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://nominatim.openstreetmap.org/',
      timeout: config.timeout || 5000,
      rateLimitDelay: config.rateLimitDelay || 1000, // 1 second between requests
    };
  }

  async getAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
    if (!query.trim() || query.length < 3) {
      return [];
    }

    return new Promise(resolve => {
      this.requestQueue.push(async () => {
        try {
          const suggestions = await this.fetchSuggestions(query);
          resolve(suggestions);
        } catch (error) {
          console.error('Geocoding service error:', error);
          // Fallback to mock data
          resolve(this.getMockSuggestions(query));
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        // Rate limiting: ensure minimum delay between requests
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.config.rateLimitDelay) {
          await new Promise(resolve =>
            setTimeout(
              resolve,
              this.config.rateLimitDelay - timeSinceLastRequest
            )
          );
        }

        await request();
        this.lastRequestTime = Date.now();
      }
    }

    this.isProcessingQueue = false;
  }

  private async fetchSuggestions(query: string): Promise<AddressSuggestion[]> {
    try {
      // Use OpenStreetMap Nominatim as primary service
      const suggestions = await this.fetchFromNominatim(query);
      if (suggestions.length > 0) {
        return suggestions;
      }
    } catch (error) {
      console.warn('Nominatim service failed, using mock data:', error);
    }

    // Fallback to mock data if Nominatim fails
    return this.getMockSuggestions(query);
  }

  private async fetchFromNominatim(
    query: string
  ): Promise<AddressSuggestion[]> {
    const url = new URL('search', this.config.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '10');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('countrycodes', 'ru');
    url.searchParams.set('accept-language', 'ru');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MarinaObuv/1.0 (Address Autocomplete)',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim HTTP error! status: ${response.status}`);
    }

    const data: NominatimResponse[] = await response.json();
    return this.parseNominatimResponse(data);
  }

  private parseNominatimResponse(
    data: NominatimResponse[]
  ): AddressSuggestion[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => {
      const address = item.address;
      let formattedAddress = item.display_name;

      if (address) {
        const parts = [];
        if (address.house_number && address.road) {
          parts.push(`${address.road}, ${address.house_number}`);
        } else if (address.road) {
          parts.push(address.road);
        }
        if (address.city) {
          parts.push(address.city);
        }
        if (address.state) {
          parts.push(address.state);
        }
        if (parts.length > 0) {
          formattedAddress = parts.join(', ');
        }
      }

      return {
        id: `nominatim_${item.place_id}`,
        address: formattedAddress,
        description: item.class === 'place' ? 'Место' : 'Адрес',
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      };
    });
  }

  private getMockSuggestions(query: string): AddressSuggestion[] {
    const mockAddresses = [
      'Москва, Красная площадь, 1',
      'Москва, Тверская улица, 10',
      'Москва, Арбат, 15',
      'Санкт-Петербург, Невский проспект, 28',
      'Санкт-Петербург, Дворцовая площадь, 2',
      'Екатеринбург, проспект Ленина, 5',
      'Новосибирск, Красный проспект, 25',
      'Казань, улица Баумана, 12',
      'Нижний Новгород, Большая Покровская, 8',
      'Челябинск, проспект Ленина, 15',
      'Ростов-на-Дону, Большая Садовая, 20',
      'Воронеж, проспект Революции, 25',
      'Краснодар, Красная улица, 30',
      'Самара, Молодогвардейская, 35',
      'Уфа, Ленина, 40',
    ];

    const filtered = mockAddresses.filter(addr =>
      addr.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, 8).map((address, index) => ({
      id: `mock_${index}`,
      address,
      description: 'Пример адреса',
    }));
  }
}

// Export singleton instance
export const addressGeocodingService = new ProductionAddressGeocodingService();

// Export class for testing
export { ProductionAddressGeocodingService };
