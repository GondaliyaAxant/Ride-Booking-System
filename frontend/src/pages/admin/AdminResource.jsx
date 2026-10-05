import {
    useEffect,
    useState,
} from "react";

import api from "../../api/axios";

const AdminResource = ({
    title,
    endpoint,
    fields,
}) => {
    const [rows, setRows] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [modal, setModal] =
        useState(false);

    const [editing, setEditing] =
        useState(null);

    const [form, setForm] =
        useState({});

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get(
                    `/${endpoint}`
                );

            setRows(
                response.data.data ||
                    response.data ||
                    []
            );
        } catch (err) {
            setError(
                err.response?.data
                    ?.message ||
                    `Unable to load ${title}.`
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [endpoint]);

    const openAdd = () => {
        const initial = {};

        fields.forEach(
            (field) => {
                initial[field] =
                    "";
            }
        );

        setForm(initial);
        setEditing(null);
        setModal(true);
    };

    const openEdit = (
        item
    ) => {
        const initial = {};

        fields.forEach(
            (field) => {
                const value =
                    item[field];

                initial[field] =
                    typeof value ===
                    "object"
                        ? value?._id ||
                          ""
                        : value ??
                          "";
            }
        );

        setForm(initial);
        setEditing(item);
        setModal(true);
    };

    const save = async (
        e
    ) => {
        e.preventDefault();

        try {
            if (editing) {
                await api.put(
                    `/${endpoint}/${editing._id}`,
                    form
                );
            } else {
                await api.post(
                    `/${endpoint}`,
                    form
                );
            }

            setModal(false);
            load();
        } catch (err) {
            setError(
                err.response?.data
                    ?.message ||
                    "Unable to save record."
            );
        }
    };

    const remove =
        async (id) => {
            if (
                !window.confirm(
                    "Delete this record?"
                )
            ) {
                return;
            }

            try {
                await api.delete(
                    `/${endpoint}/${id}`
                );

                load();
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to delete record."
                );
            }
        };

    const filtered =
        rows.filter(
            (row) =>
                JSON.stringify(
                    row
                )
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
        );

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        {title}
                    </h1>

                    <p>
                        Manage {title.toLowerCase()}.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={
                        openAdd
                    }
                >
                    + Add {title}
                </button>

            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="content-card">

                <div className="table-toolbar">

                    <input
                        placeholder={`Search ${title}...`}
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target
                                    .value
                            )
                        }
                    />

                    <span>
                        {
                            filtered.length
                        }{" "}
                        records
                    </span>

                </div>

                {loading ? (
                    <div className="empty-state">
                        Loading...
                    </div>
                ) : filtered.length ===
                  0 ? (
                    <div className="empty-state">
                        <div>
                            📭
                        </div>

                        <h3>
                            No records
                        </h3>

                        <p>
                            No {title.toLowerCase()} found.
                        </p>
                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table>

                            <thead>
                                <tr>

                                    {fields.map(
                                        (
                                            field
                                        ) => (
                                            <th
                                                key={
                                                    field
                                                }
                                            >
                                                {
                                                    field
                                                }
                                            </th>
                                        )
                                    )}

                                    <th>
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {filtered.map(
                                    (
                                        row
                                    ) => (
                                        <tr
                                            key={
                                                row._id
                                            }
                                        >

                                            {fields.map(
                                                (
                                                    field
                                                ) => (
                                                    <td
                                                        key={
                                                            field
                                                        }
                                                    >
                                                        {display(
                                                            row[
                                                                field
                                                            ]
                                                        )}
                                                    </td>
                                                )
                                            )}

                                            <td>

                                                <div className="action-buttons">

                                                    <button
                                                        className="icon-btn"
                                                        onClick={() =>
                                                            openEdit(
                                                                row
                                                            )
                                                        }
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        className="icon-btn danger"
                                                        onClick={() =>
                                                            remove(
                                                                row._id
                                                            )
                                                        }
                                                    >
                                                        🗑️
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {modal && (
                <div className="modal-overlay">

                    <div className="modal">

                        <div className="modal-header">

                            <h2>
                                {editing
                                    ? "Edit"
                                    : "Add"}{" "}
                                {title}
                            </h2>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            className="form-grid"
                            onSubmit={save}
                        >

                            {fields.map(
                                (
                                    field
                                ) => (
                                    <div
                                        className="form-group"
                                        key={
                                            field
                                        }
                                    >

                                        <label>
                                            {field}
                                        </label>

                                        <input
                                            value={
                                                form[
                                                    field
                                                ] ??
                                                ""
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    {
                                                        ...form,
                                                        [field]:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />

                                    </div>
                                )
                            )}

                            <div className="grid-full modal-actions">

                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() =>
                                        setModal(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button className="btn btn-primary">
                                    Save
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
};

const display = (
    value
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    if (
        typeof value ===
        "object"
    ) {
        return (
            value.name ||
            value.email ||
            value._id ||
            "Object"
        );
    }

    if (
        typeof value ===
        "boolean"
    ) {
        return value
            ? "Yes"
            : "No";
    }

    return value;
};

export default AdminResource;