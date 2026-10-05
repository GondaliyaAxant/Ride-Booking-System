import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

const LocationSearch = ({
    label,
    placeholder = "Search location",
    value = "",
    onChange,
    onLocationSelected,
}) => {
    const places = useMapsLibrary("places");

    const inputRef = useRef(null);
    const sessionTokenRef = useRef(null);
    const debounceRef = useRef(null);
    const requestIdRef = useRef(0);

    const [localValue, setLocalValue] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    // Create a new Places session
    useEffect(() => {
        if (!places) return;

        const { AutocompleteSessionToken } = places;

        if (AutocompleteSessionToken) {
            sessionTokenRef.current =
                new AutocompleteSessionToken();
        }
    }, [places]);

    const searchPlaces = async (text) => {
        const searchText = text.trim();

        if (searchText.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (!places) {
            return;
        }

        const { AutocompleteSuggestion, AutocompleteSessionToken } =
            places;

        if (!AutocompleteSuggestion) {
            console.error(
                "AutocompleteSuggestion is unavailable.",
                places
            );

            setError(
                "Google Places is unavailable. Check your Maps API configuration."
            );

            return;
        }

        const requestId = ++requestIdRef.current;

        try {
            setLoading(true);
            setError("");

            if (
                !sessionTokenRef.current &&
                AutocompleteSessionToken
            ) {
                sessionTokenRef.current =
                    new AutocompleteSessionToken();
            }

            const request = {
                input: searchText,

                // India only
                includedRegionCodes: ["in"],

                language: "en",
                region: "IN",

                sessionToken:
                    sessionTokenRef.current || undefined,
            };

            console.log(
                "Places autocomplete request:",
                request
            );

            const response =
                await AutocompleteSuggestion
                    .fetchAutocompleteSuggestions(request);

            // Ignore stale response
            if (requestId !== requestIdRef.current) {
                return;
            }

            const placeResults =
                (response?.suggestions || []).filter(
                    (item) => item?.placePrediction
                );

            console.log(
                "Places suggestions:",
                placeResults
            );

            setSuggestions(placeResults);
            setShowSuggestions(placeResults.length > 0);
        } catch (err) {
            console.error(
                "Google Places autocomplete error:",
                err
            );

            setSuggestions([]);
            setShowSuggestions(false);

            // IMPORTANT:
            // Don't hide the actual configuration/API error.
            setError(
                err?.message ||
                    "Unable to search Google locations."
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    const handleChange = (event) => {
        const newValue = event.target.value;

        setLocalValue(newValue);

        if (onChange) {
            onChange(newValue);
        }

        // Previous coordinates are no longer valid.
        if (onLocationSelected) {
            onLocationSelected(null);
        }

        setSuggestions([]);
        setShowSuggestions(false);
        setError("");

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (newValue.trim().length < 2) {
            return;
        }

        debounceRef.current = setTimeout(() => {
            searchPlaces(newValue);
        }, 300);
    };

    const handleSelect = async (suggestion) => {
        const prediction = suggestion?.placePrediction;

        if (!prediction) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            const place = prediction.toPlace();

            await place.fetchFields({
                fields: [
                    "displayName",
                    "formattedAddress",
                    "location",
                ],
            });

            if (!place.location) {
                throw new Error(
                    "Google did not return coordinates for this location."
                );
            }

            const latitude = place.location.lat();
            const longitude = place.location.lng();

            const address =
                place.formattedAddress ||
                place.displayName ||
                prediction.text?.text ||
                "";

            const selectedLocation = {
                address,
                latitude,
                longitude,
                placeId: place.id || null,
            };

            console.log(
                "Selected location:",
                selectedLocation
            );

            setLocalValue(address);
            setSuggestions([]);
            setShowSuggestions(false);
            setError("");

            if (onChange) {
                onChange(address);
            }

            if (onLocationSelected) {
                onLocationSelected(selectedLocation);
            }

            // New Places session after selection
            if (places?.AutocompleteSessionToken) {
                sessionTokenRef.current =
                    new places.AutocompleteSessionToken();
            }
        } catch (err) {
            console.error(
                "Google place selection error:",
                err
            );

            setError(
                err?.message ||
                    "Could not get coordinates for this location."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                inputRef.current &&
                !inputRef.current.parentElement?.contains(
                    event.target
                )
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div
            style={{
                marginBottom: "18px",
                position: "relative",
            }}
        >
            {label && (
                <label
                    style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: 600,
                        color: "#111827",
                    }}
                >
                    {label}
                </label>
            )}

            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={handleChange}
                onFocus={() => {
                    if (suggestions.length > 0) {
                        setShowSuggestions(true);
                    }
                }}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    outline: "none",
                    fontSize: "15px",
                    background: "#fff",
                }}
            />

            <div
                style={{
                    marginTop: "5px",
                    fontSize: "12px",
                    color: "#6b7280",
                }}
            >
                📍 Type a location and select one of the
                Google suggestions
            </div>

            {loading && (
                <div
                    style={{
                        marginTop: "5px",
                        fontSize: "12px",
                        color: "#6b7280",
                    }}
                >
                    Searching...
                </div>
            )}

            {error && (
                <div
                    style={{
                        marginTop: "5px",
                        fontSize: "12px",
                        color: "#dc2626",
                    }}
                >
                    {error}
                </div>
            )}

            {showSuggestions &&
                suggestions.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: label ? "70px" : "45px",
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            boxShadow:
                                "0 8px 20px rgba(0,0,0,0.15)",
                            zIndex: 999999,
                            overflow: "hidden",
                        }}
                    >
                        {suggestions.map(
                            (suggestion, index) => {
                                const prediction =
                                    suggestion.placePrediction;

                                if (!prediction) {
                                    return null;
                                }

                                const title =
                                    prediction.mainText?.text ||
                                    prediction.text?.text ||
                                    "Location";

                                const description =
                                    prediction.secondaryText
                                        ?.text || "";

                                return (
                                    <button
                                        key={
                                            prediction.placeId ||
                                            index
                                        }
                                        type="button"
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() =>
                                            handleSelect(
                                                suggestion
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            display: "block",
                                            textAlign: "left",
                                            border: "none",
                                            background: "#fff",
                                            padding: "12px 14px",
                                            cursor: "pointer",
                                            borderBottom:
                                                "1px solid #eee",
                                        }}
                                        onMouseEnter={(event) => {
                                            event.currentTarget.style.background =
                                                "#f3f4f6";
                                        }}
                                        onMouseLeave={(event) => {
                                            event.currentTarget.style.background =
                                                "#fff";
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: "14px",
                                                color: "#111827",
                                            }}
                                        >
                                            📍 {title}
                                        </div>

                                        {description && (
                                            <div
                                                style={{
                                                    marginTop: "3px",
                                                    fontSize: "12px",
                                                    color: "#6b7280",
                                                }}
                                            >
                                                {description}
                                            </div>
                                        )}
                                    </button>
                                );
                            }
                        )}

                        <div
                            style={{
                                padding: "6px 10px",
                                textAlign: "right",
                                fontSize: "10px",
                                color: "#777",
                                background: "#fafafa",
                            }}
                        >
                            Powered by Google
                        </div>
                    </div>
                )}
        </div>
    );
};

export default LocationSearch;