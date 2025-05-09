const { compareImages } = require('./imageComparison');

// Test the image comparison
async function runTest() {
    try {
        // Replace 'path/to/your/local/image.jpg' with the actual path to your local image
        const localImagePath = '/Users/jordan/Desktop/Screenshot 2025-05-04 at 2.37.05 AM.png';  // You'll need to provide this
        const amazonImageUrl = 'https://m.media-amazon.com/images/I/61AdY-P47YL.jpg';

        console.log('Starting image comparison test...');
        const result = await compareImages(localImagePath, amazonImageUrl);
        
        if (result.success) {
            console.log('\nTest completed successfully!');
        } else {
            console.error('Test failed:', result.error);
        }
    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run the test
runTest(); 