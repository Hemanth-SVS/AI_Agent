const PollingStation = require('../models/PollingStation');

exports.getPollingStation = async (req, res) => {
    try {
        const { voterId } = req.query;

        if (!voterId) {
            return res.status(400).json({
                success: false,
                message: 'Voter ID is required'
            });
        }

        const polling = await PollingStation.findOne({ voterId });

        if (!polling) {
            return res.status(404).json({
                success: false,
                message: 'Polling station information not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                pollingStation: polling.pollingStation,
                address: polling.address,
                assembly: polling.assembly,
                district: polling.district,
                state: polling.state,
                blo: polling.blo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};