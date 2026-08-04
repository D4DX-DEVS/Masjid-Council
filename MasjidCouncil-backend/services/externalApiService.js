const axios = require('axios');

class ExternalApiService {
    constructor() {
        this.baseUrl = process.env.UNIT_API_ENDPOINT || 'https://cenloginbackend.d4dx.co/api';
    }

    // Fetch district details
    async getDistrictDetails(districtId) {
        try {
            const response = await axios.get(`${this.baseUrl}/districts/${districtId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching district details:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch area details
    async getAreaDetails(areaId) {
        try {
            const response = await axios.get(`${this.baseUrl}/halqas/area/${areaId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching area details:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch areas belonging to a district
    async getAreasByDistrict(districtId) {
        try {
            const response = await axios.get(`${this.baseUrl}/areas/district/${districtId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching areas by district:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch units (halqas) belonging to an area
    async getUnitsByArea(areaId) {
        try {
            const response = await axios.get(`${this.baseUrl}/halqas/area/${areaId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching units by area:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch unit details
    async getUnitDetails(unitId) {
        try {
            const response = await axios.get(`${this.baseUrl}/units/${unitId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching unit details:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch all districts
    async getAllDistricts() {
        try {
            const response = await axios.get(`${this.baseUrl}/districts`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching all districts:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch all areas
    async getAllAreas() {
        try {
            const response = await axios.get(`${this.baseUrl}/halqas`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching all areas:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch all units
    async getAllUnits() {
        try {
            const response = await axios.get(`${this.baseUrl}/units`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching all units:', error.message);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
}

module.exports = new ExternalApiService(); 