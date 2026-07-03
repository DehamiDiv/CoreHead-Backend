$headers = @{ 'Content-Type' = 'application/json' }
$url = 'http://localhost:5000/api/posts'

$posts = @(
  @{
    title = 'The Hidden Wonders of Ancient Rainforests'
    slug = 'hidden-wonders-ancient-rainforests'
    excerpt = 'Deep within the worlds oldest rainforests lie ecosystems untouched by time, where biodiversity thrives in ways science is only beginning to understand.'
    content = 'Deep within the worlds oldest rainforests lie ecosystems untouched by time. Ancient trees tower hundreds of feet overhead, their canopies forming a living cathedral that shelters thousands of species. Scientists have discovered that old-growth trees communicate through underground fungal networks, sharing nutrients and warning signals across vast distances. Protecting these irreplaceable habitats is not just an environmental issue - it is a matter of preserving the planets biological heritage.'
    status = 'published'
    category = 'Environment'
    thumbnailUrl = 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80'
    featured = $true
    authorId = 1
  },
  @{
    title = 'Protecting Coral Reefs in a Warming Ocean'
    slug = 'protecting-coral-reefs-warming-ocean'
    excerpt = 'Coral reefs cover less than 1 percent of the ocean floor yet support over 25 percent of all marine life.'
    content = 'Coral reefs are among the most biodiverse ecosystems on Earth. Rising ocean temperatures cause coral bleaching, threatening these irreplaceable habitats. Marine biologists are developing innovative techniques including coral gardening and assisted evolution to restore damaged reefs and build resilience against climate change.'
    status = 'published'
    category = 'Aquatic Life'
    thumbnailUrl = 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80'
    featured = $false
    authorId = 1
  },
  @{
    title = 'The Secret Language of Trees'
    slug = 'secret-language-of-trees'
    excerpt = 'Scientists have discovered that trees communicate through underground fungal networks, sharing nutrients and warning signals across entire forests.'
    content = 'Beneath every forest floor lies a vast network of mycorrhizal fungi connecting tree roots in what scientists call the Wood Wide Web. Through these networks, trees share carbon, water, and chemical signals. Mother trees nurture their seedlings and even send nutrients to dying neighbours, revealing a level of forest cooperation that challenges our understanding of plant life.'
    status = 'published'
    category = 'Nature Photography'
    thumbnailUrl = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80'
    featured = $false
    authorId = 1
  },
  @{
    title = 'Eco-Living: Simple Steps Toward a Sustainable Home'
    slug = 'eco-living-sustainable-home-guide'
    excerpt = 'From composting to solar energy, discover practical ways to reduce your carbon footprint without sacrificing comfort.'
    content = 'Living sustainably does not require drastic lifestyle changes. Small consistent actions such as reducing single-use plastics, choosing renewable energy, and growing a kitchen garden can significantly lower your environmental impact. This guide covers ten achievable steps to make your home greener, healthier, and more cost-efficient in the long run.'
    status = 'published'
    category = 'Eco-Living'
    thumbnailUrl = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80'
    featured = $false
    authorId = 1
  },
  @{
    title = 'Migratory Birds: Natures Most Remarkable Journeys'
    slug = 'migratory-birds-remarkable-journeys'
    excerpt = 'Every year billions of birds travel thousands of miles across continents and oceans in one of natures most extraordinary spectacles.'
    content = 'Bird migration is one of the most awe-inspiring phenomena in the natural world. Arctic Terns travel from pole to pole each year covering 70000 kilometres. Bar-tailed Godwits fly non-stop for nine days across the Pacific Ocean. Scientists use satellite tracking and geolocators to map these incredible journeys and understand how birds navigate using stars, magnetic fields, and landmarks.'
    status = 'published'
    category = 'Outdoor Adventures'
    thumbnailUrl = 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80'
    featured = $false
    authorId = 1
  }
)

foreach ($post in $posts) {
  $body = $post | ConvertTo-Json
  try {
    $r = Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers -ErrorAction Stop
    Write-Host "Created: $($r.title)"
  } catch {
    Write-Host "Error/Skip: $($post.title) => $($_.Exception.Message)"
  }
}
Write-Host "Seeding complete!"
