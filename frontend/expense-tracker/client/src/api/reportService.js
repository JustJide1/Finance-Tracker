import api from "./axios";

export const reportService = {
    getAnnualReport: (year) =>
        api.get(`/reports/annual?year=${year}`).then((r) => r.data),
};
