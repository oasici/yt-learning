// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load data
    fetch('../data/categorized_videos.json')
        .then(response => response.json())
        .then(data => {
            initializeApp(data);
        })
        .catch(error => {
            console.error('Error loading video data:', error);
            document.querySelector('main').innerHTML = `
                <div class="container error-container">
                    <h2>Error Loading Data</h2>
                    <p>Sorry, we couldn't load the video data. Please try again later.</p>
                </div>
            `;
        });

    // Initialize event listeners
    document.querySelector('.close-button').addEventListener('click', closeModal);
    document.getElementById('search-button').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});

function initializeApp(data) {
    const videos = data.videos;
    const categories = data.categories;
    
    // Populate featured videos section
    populateFeaturedVideos(videos);
    
    // Populate categories section
    populateCategories(categories, videos);
}

function populateFeaturedVideos(videos) {
    const featuredVideosContainer = document.getElementById('featured-videos');
    
    // Select 5 random videos for featured section
    const featuredVideos = getRandomItems(videos, 5);
    
    featuredVideos.forEach(video => {
        const videoCard = createVideoCard(video);
        featuredVideosContainer.appendChild(videoCard);
    });
}

function populateCategories(categories, videos) {
    const categoryGrid = document.getElementById('category-grid');
    
    categories.forEach(category => {
        const categoryVideos = category.video_ids.map(id => 
            videos.find(video => video.video_id === id)
        ).filter(Boolean);
        
        if (categoryVideos.length > 0) {
            const categoryCard = createCategoryCard(category, categoryVideos[0]);
            categoryGrid.appendChild(categoryCard);
            
            // Add event listener to category card
            categoryCard.addEventListener('click', () => {
                showCategoryVideos(category, categoryVideos);
            });
        }
    });
}

function createVideoCard(video) {
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';
    
    const thumbnailUrl = video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`;
    
    videoCard.innerHTML = `
        <div class="video-thumbnail">
            <img src="${thumbnailUrl}" alt="${video.title || 'Video thumbnail'}">
            <div class="play-button">▶</div>
        </div>
        <div class="video-info">
            <h3>${video.title || 'Untitled Video'}</h3>
            <p>${video.channel || 'Unknown Channel'}</p>
        </div>
    `;
    
    videoCard.addEventListener('click', () => {
        openVideoModal(video);
    });
    
    return videoCard;
}

function createCategoryCard(category, sampleVideo) {
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    
    const thumbnailUrl = sampleVideo.thumbnail_url || `https://img.youtube.com/vi/${sampleVideo.video_id}/maxresdefault.jpg`;
    
    categoryCard.innerHTML = `
        <div class="category-thumbnail">
            <img src="${thumbnailUrl}" alt="${category.name}">
        </div>
        <div class="category-info">
            <h3>${category.name}</h3>
            <p>Explore videos about ${category.name.toLowerCase()}</p>
            <span class="video-count">${category.count} videos</span>
        </div>
    `;
    
    return categoryCard;
}

function openVideoModal(video) {
    const modal = document.getElementById('video-modal');
    const videoContainer = document.getElementById('video-container');
    const videoTitle = document.getElementById('video-title');
    const videoChannel = document.getElementById('video-channel');
    const videoDescription = document.getElementById('video-description');
    
    // Set video content
    videoContainer.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${video.video_id}" 
            allowfullscreen
        ></iframe>
    `;
    
    videoTitle.textContent = video.title || 'Untitled Video';
    videoChannel.textContent = video.channel || 'Unknown Channel';
    videoDescription.textContent = video.description || 'No description available.';
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Load related videos
    loadRelatedVideos(video);
}

function closeModal() {
    const modal = document.getElementById('video-modal');
    const videoContainer = document.getElementById('video-container');
    
    // Clear video to stop playback
    videoContainer.innerHTML = '';
    
    // Hide modal
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

function loadRelatedVideos(currentVideo) {
    fetch('../data/categorized_videos.json')
        .then(response => response.json())
        .then(data => {
            const relatedVideosContainer = document.getElementById('related-videos-container');
            relatedVideosContainer.innerHTML = '';
            
            // Find which category the current video belongs to
            let categoryName = '';
            for (const category of data.categories) {
                if (category.video_ids.includes(currentVideo.video_id)) {
                    categoryName = category.name;
                    break;
                }
            }
            
            // Get other videos from the same category
            const relatedVideos = data.videos.filter(video => 
                video.video_id !== currentVideo.video_id && 
                data.categories.find(c => c.name === categoryName)?.video_ids.includes(video.video_id)
            );
            
            // Display up to 4 related videos
            const videosToShow = relatedVideos.slice(0, 4);
            
            videosToShow.forEach(video => {
                const videoCard = createVideoCard(video);
                relatedVideosContainer.appendChild(videoCard);
            });
        })
        .catch(error => {
            console.error('Error loading related videos:', error);
        });
}

function showCategoryVideos(category, videos) {
    // Replace main content with category videos
    const main = document.querySelector('main');
    
    main.innerHTML = `
        <section class="category-detail">
            <div class="container">
                <div class="category-header">
                    <h2>${category.name}</h2>
                    <button id="back-button">Back to Categories</button>
                </div>
                <div class="category-videos" id="category-videos"></div>
            </div>
        </section>
    `;
    
    // Add event listener to back button
    document.getElementById('back-button').addEventListener('click', () => {
        window.location.reload();
    });
    
    // Populate category videos
    const categoryVideosContainer = document.getElementById('category-videos');
    
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        categoryVideosContainer.appendChild(videoCard);
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        return;
    }
    
    fetch('../data/categorized_videos.json')
        .then(response => response.json())
        .then(data => {
            const searchResults = data.videos.filter(video => 
                (video.title && video.title.toLowerCase().includes(searchTerm)) || 
                (video.description && video.description.toLowerCase().includes(searchTerm))
            );
            
            displaySearchResults(searchTerm, searchResults);
        })
        .catch(error => {
            console.error('Error searching videos:', error);
        });
}

function displaySearchResults(searchTerm, results) {
    const main = document.querySelector('main');
    
    main.innerHTML = `
        <section class="search-results">
            <div class="container">
                <div class="search-header">
                    <h2>Search Results for "${searchTerm}"</h2>
                    <button id="back-button">Back to Categories</button>
                </div>
                <p>${results.length} videos found</p>
                <div class="search-results-grid" id="search-results-grid"></div>
            </div>
        </section>
    `;
    
    // Add event listener to back button
    document.getElementById('back-button').addEventListener('click', () => {
        window.location.reload();
    });
    
    // Populate search results
    const searchResultsGrid = document.getElementById('search-results-grid');
    
    if (results.length === 0) {
        searchResultsGrid.innerHTML = `
            <div class="no-results">
                <p>No videos found matching your search. Try different keywords.</p>
            </div>
        `;
        return;
    }
    
    results.forEach(video => {
        const videoCard = createVideoCard(video);
        searchResultsGrid.appendChild(videoCard);
    });
}

// Utility function to get random items from an array
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Handle clicks outside the modal to close it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('video-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Handle escape key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});
