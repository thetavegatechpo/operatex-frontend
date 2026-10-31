import Table from './SmartTable.jsx';
import React from "react";

import {

    Card,



    Spinner

} from "react-bootstrap";

import Loader from "./Loader.jsx";

import NoData from "./NoData.jsx";

function DataTable({

    paginate = true,
    columns = [],

    data = [],

    loading = false,

    renderActions,

    emptyMessage = "No Data Found"

}) {
    

    return (

        <Card className="shadow-sm border-0">

            <Card.Body className="p-0">

                <div className="table-responsive">

                    <Table
                        paginate={paginate}

                        hover

                        striped

                        className="mb-0 align-middle"

                    >

                        <thead className="table-dark">

                            <tr>

                                {

                                    columns.map((column) => (

                                        <th

                                            key={column.key}

                                        >

                                            {column.label}

                                        </th>

                                    ))

                                }

                                {

                                    renderActions &&

                                    <th

                                        className="text-center"

                                    >

                                        Actions

                                    </th>

                                }

                            </tr>

                        </thead>

                        <tbody>

                            {

                                loading ?

                                (

                                    <tr>

                                        <td

                                            colSpan={

                                                columns.length +

                                                (

                                                    renderActions

                                                    ?

                                                    1

                                                    :

                                                    0

                                                )

                                            }

                                        >

                                            <Loader />

                                        </td>

                                    </tr>

                                )

                                :

                                data.length===0 ?

                                (

                                    <tr>

                                        <td

                                            colSpan={

                                                columns.length +

                                                (

                                                    renderActions

                                                    ?

                                                    1

                                                    :

                                                    0

                                                )

                                            }

                                        >

                                            <NoData

                                                message={

                                                    emptyMessage

                                                }

                                            />

                                        </td>

                                    </tr>

                                )

                                :

                                data.map(

                                    (

                                        row,

                                        index

                                    )=>(

                                        <tr

                                            key={

                                                index

                                            }

                                        >

                                            {

                                                columns.map(

                                                    (

                                                        column

                                                    )=>(

                                                        <td

                                                            key={

                                                                column.key

                                                            }

                                                        >

                                                            {

                                                                column.render

                                                                ?

                                                                column.render(

                                                                    row,
                                                                    index

                                                                )

                                                                :

                                                                row[

                                                                    column.key

                                                                ]

                                                            }

                                                        </td>

                                                    )

                                                )

                                            }

                                            {

                                                renderActions &&

                                                <td

                                                    className="text-center"

                                                >

                                                    {

                                                        renderActions(

                                                            row

                                                        )

                                                    }

                                                </td>

                                            }

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

export default DataTable;