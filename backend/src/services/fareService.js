const FARE_CONFIG = {
    bike: {
        baseFare: 30,
        perKm: 10,
    },

    auto: {
        baseFare: 40,
        perKm: 14,
    },

    car: {
        baseFare: 70,
        perKm: 18,
    },
};

const calculateFare = (vehicleType, distanceKm) => {
    const config = FARE_CONFIG[vehicleType];

    if (!config) {
        throw new Error(
            "Invalid vehicle type. Use bike, auto or car."
        );
    }

    const distance = Number(distanceKm);

    if (!Number.isFinite(distance) || distance < 0) {
        throw new Error("Invalid distance");
    }

    const fare =
        config.baseFare +
        distance * config.perKm;

    return Math.round(fare);
};

const getFareConfig = () => {
    return FARE_CONFIG;
};

module.exports = {
    calculateFare,
    getFareConfig,
};