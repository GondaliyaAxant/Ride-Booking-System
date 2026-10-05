import {
    Link,
} from "react-router-dom";

import Navbar from "../components/Navbar";

const Home = () => {
    return (
        <div className="home">

            <Navbar />

            <section className="hero">

                <div className="hero-content">

                    <span className="hero-badge">
                        SAFE • SIMPLE • RELIABLE
                    </span>

                    <h1>
                        Your ride.
                        <br />
                        Your journey.
                    </h1>

                    <p>
                        Book rides easily,
                        connect with trusted
                        drivers and manage
                        your complete journey
                        from one place.
                    </p>

                    <div className="hero-actions">

                        <Link
                            to="/register"
                            className="btn btn-primary btn-large"
                        >
                            Book a Ride →
                        </Link>

                        <Link
                            to="/login"
                            className="btn btn-outline btn-large"
                        >
                            Login
                        </Link>

                    </div>

                    <div className="hero-features">
                        <span>
                            ✓ Easy booking
                        </span>

                        <span>
                            ✓ Trusted drivers
                        </span>

                        <span>
                            ✓ Women safety
                        </span>
                    </div>

                </div>

                <div className="hero-visual">

                    <div className="map-card">

                        <div className="map-line one"></div>
                        <div className="map-line two"></div>
                        <div className="map-line three"></div>

                        <div className="map-pin pickup">
                            A
                        </div>

                        <div className="map-pin destination">
                            B
                        </div>

                        <div className="ride-card">

                            <small>
                                UPCOMING RIDE
                            </small>

                            <h3>
                                City Center
                            </h3>

                            <span>
                                ↓
                            </span>

                            <h3>
                                Airport
                            </h3>

                            <div className="ride-driver">
                                🚗 Driver assigned
                                <br />
                                ⭐ 4.9 rating
                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default Home;