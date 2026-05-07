import { DEBUG } from '@/constants/CONSTANTS';

interface calculateCardDimensionsInput {
    containerWidth: number, 
    MARGIN: number, 
    GAP_WIDTH: number, 
    MIN_CARD_WIDTH: number
}

export default function calculateCardDimensions({containerWidth, MARGIN, GAP_WIDTH, MIN_CARD_WIDTH}: calculateCardDimensionsInput) 
{
    let _dynamicCardWidth = MIN_CARD_WIDTH;
    let _rowCount = 1;
    if (containerWidth > 0) 
    {
        const rawItemsPerRow = (containerWidth - (MARGIN * 2) + GAP_WIDTH) / (MIN_CARD_WIDTH + GAP_WIDTH);
        _rowCount = Math.floor(rawItemsPerRow);
        _rowCount = Math.max(1, _rowCount || 1);

        _dynamicCardWidth = Math.floor((containerWidth - (MARGIN * 2) - (_rowCount - 1) * GAP_WIDTH) / _rowCount);
    }

    if (DEBUG) console.log("LOG::Executed: calculateCardDimensions");
    
    return { 
        dynamicCardWidth: _dynamicCardWidth, 
        rowCount: _rowCount 
    };
}