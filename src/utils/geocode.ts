import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { KEYS } from "./keys";

class GeocodeService {
  private geocoder: any | null = null;

  private async getGeocoder() {
    if (this.geocoder) {
      return this.geocoder;
    }

    setOptions({
      key: KEYS.GOOGLE_PLACE_API_KEY as string,
    });

    const { Geocoder } = await importLibrary("geocoding");
    this.geocoder = new Geocoder();
    return this.geocoder;
  }

  async reverseGeocode(longitude: number, latitude: number) {
    const geocoder = await this.getGeocoder();

    const { results } = await geocoder.geocode({
      location: {
        lat: latitude,
        lng: longitude,
      },
    });

    if (!results.length) return null;

    const components = results[0].address_components;

    const getComponent = (...types: string[]) =>
      components.find((c: any) => types.some((type) => c.types.includes(type)))
        ?.long_name;

    const city =
      getComponent("locality") ||
      getComponent("administrative_area_level_2") ||
      getComponent("sublocality");
    const country = getComponent("country");

    return { city: city ?? null, country: country ?? null };
  }
}

export const geocodeService = new GeocodeService();
