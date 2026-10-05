import {
    Map,
    AdvancedMarker,
    Polyline,
} from "@vis.gl/react-google-maps";

const DEFAULT_CENTER = {
    lat: 22.5645,
    lng: 72.9289,
};

const GoogleMap = ({
    pickup,
    destination,
    routePolyline,
}) => {
    const center = pickup || destination || DEFAULT_CENTER;

    return (
        <div
            style={{
                width: "100%",
                height: "500px",
                borderRadius: "16px",
                overflow: "hidden",
                position: "relative",
                zIndex: 1,
            }}
        >
            <Map
                center={center}
                zoom={13}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                disableDefaultUI={false}
            >
                {pickup && (
                    <AdvancedMarker
                        position={pickup}
                        title="Pickup"
                    />
                )}

                {destination && (
                    <AdvancedMarker
                        position={destination}
                        title="Destination"
                    />
                )}

                {routePolyline && (
                    <Polyline
                        encodedPath={routePolyline}
                        strokeOpacity={0.9}
                        strokeWeight={5}
                    />
                )}
            </Map>
        </div>
    );
};

export default GoogleMap;