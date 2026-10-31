import React from "react";

import {
    Card,
    Row,
    Col,
    InputGroup,
    Form,
    Button
} from "react-bootstrap";

import {
    Search,
    ArrowClockwise,
    PlayFill,
    ClockHistory,
    FileText,
    Download
} from "react-bootstrap-icons";

function SearchToolbar({

    searchText = "",

    onSearch,

    status = "ALL",

    onStatusChange,

    onRefresh,

    onExecute,

    onRuntime,

    onReport,

    onExport,

    showStatus = true,

    showRefresh = true,

    showExecute = true,

    showRuntime = true,

    showReport = true,

    showExport = true

}) {

    return (

        <Card className="shadow-sm border-0 mb-4">

            <Card.Body>

                <Row className="g-3 align-items-center">

                    <Col lg={5} md={12}>

                        <InputGroup>

                            <InputGroup.Text>
                                <Search />
                            </InputGroup.Text>

                            <Form.Control
                                type="text"
                                placeholder="Search..."
                                value={searchText}
                                onChange={(e) =>
                                    onSearch(e.target.value)
                                }
                            />

                        </InputGroup>

                    </Col>

                    {
                        showStatus &&

                        <Col lg={2} md={4}>

                            <Form.Select
                                value={status}
                                onChange={(e) =>
                                    onStatusChange(e.target.value)
                                }
                            >

                                <option value="ALL">
                                    All Status
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>

                            </Form.Select>

                        </Col>
                    }

                    <Col
                        lg={showStatus ? 5 : 7}
                        md={12}
                        className="text-lg-end"
                    >

                        {
                            showRefresh &&

                            <Button
                                variant="outline-secondary"
                                className="me-2 mb-2"
                                onClick={onRefresh}
                            >
                                <ArrowClockwise />
                            </Button>
                        }

                        {
                            showExecute &&(

                            <Button
                                variant="outline-success"
                                className="me-2 mb-2"
                                onClick={onExecute}
                            >
                                <PlayFill />
                            </Button>
                        )}

                        {
                            showRuntime &&(

                            <Button
                                variant="outline-warning"
                                className="me-2 mb-2"
                                onClick={onRuntime}
                            >
                                <ClockHistory />
                            </Button>
                        )}

                        {
                            showReport &&

                            <Button
                                variant="outline-primary"
                                className="me-2 mb-2"
                                onClick={onReport}
                            >
                                <FileText />
                            </Button>
                        }

                        {
                            showExport &&

                            <Button
                                variant="outline-dark"
                                className="mb-2"
                                onClick={onExport}
                            >
                                <Download />
                            </Button>
                        }

                    </Col>

                </Row>

            </Card.Body>

        </Card>

    );

}

export default SearchToolbar;