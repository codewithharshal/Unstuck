import React from 'react';
import { Paper, Typography, Container, Button } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';

const FindFlowPage = () => {
    return (
        <Container style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Paper variant="outlined" style={{ padding: '2rem', maxWidth: 800, width: '100%' }}>
                <Typography variant="h4" color="primary" style={{ marginBottom: '1rem' }}>
                    Find Flow
                </Typography>
                <Typography variant="body1" color="textSecondary" style={{ marginBottom: '1.5rem' }}>
                    Use Find Flow to discover communities and content tailored to your interests. This is a placeholder page — add the search, quick filters, or guided flows here.
                </Typography>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button component={RouterLink} to="/" variant="outlined">
                        Back Home
                    </Button>
                </div>
            </Paper>
        </Container>
    );
};

export default FindFlowPage;
