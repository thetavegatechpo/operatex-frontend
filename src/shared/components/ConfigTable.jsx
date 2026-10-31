import Table from './SmartTable.jsx';
import React from "react";

import {

    Card,


} from "react-bootstrap";

import Loader from "./Loader.jsx";

import NoData from "./NoData.jsx";

import ActionButtons from "./ActionButtons.jsx";

function ConfigTable({

    title = "Configuration",

    columns = [],

    data = [],

    loading = false,

    onDelete

}) {

    return (

        <Card className="shadow-sm border-0">

            <Card.Header
                className="fw-bold"
            >

                {title}

            </Card.Header>

            <Card.Body className="p-0">

                <div className="table-responsive">

                    <Table

                        hover

                        striped

                        className="mb-0 align-middle"

                    >

                        <thead className="table-dark">

                            <tr>

                                {

                                    columns.map(

                                        (column) => (

                                            <th
                                                key={column.key}
                                            >

                                                {column.label}

                                            </th>

                                        )

                                    )

                                }

                                <th
                                    className="text-center"
                                    width="80"
                                >

                                    Action

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                loading ?

                                (

                                    <tr>

                                        <td
                                            colSpan={
                                                columns.length + 1
                                            }
                                        >

                                            <Loader />

                                        </td>

                                    </tr>

                                )

                                :

                                data.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan={
                                                columns.length + 1
                                            }
                                        >

                                            <NoData
                                                message="No Configuration Found"
                                            />

                                        </td>

                                    </tr>

                                )

                                :

                                data.map(

                                    (

                                        row,

                                        index

                                    ) => (

                                        <tr
                                            key={index}
                                        >

                                            {

                                                columns.map(

                                                    (

                                                        column

                                                    ) => (

                                                        <td
                                                            key={column.key}
                                                        >

                                                            {

                                                                column.render

                                                                ?

                                                                column.render(row)

                                                                :

                                                                row[column.key]

                                                            }

                                                        </td>

                                                    )

                                                )

                                            }

                                            <td
                                                className="text-center"
                                            >

                                                <ActionButtons

                                                    showEdit={false}

                                                    showDelete

                                                    onDelete={() =>

                                                        onDelete(row)

                                                    }

                                                />

                                            </td>

                                        </tr>

                                    )

                                )

                            }

                        </tbody>

                    </Table>

                </div>

            </Card.Body>

        </Card>

    );

}

export default ConfigTable;