import assert from 'assert'

export default () => {
    return async(err, req, res, next) => {
        if (err instanceof assert.AssertionError) {
            res.json({
                code: 0,
                type: 'ERROR_PARAMS',
                message: err.message
            })
            return;
        }
        res.json({
            code: -1,
            message: `Server Error: ${err.message}`
        })
        console.error('Unhandled Error\n', err);
    }
}