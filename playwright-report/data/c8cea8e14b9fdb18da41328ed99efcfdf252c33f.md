# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios.spec.ts >> Kullanıcı Gerçek Dünya Senaryoları (E2E) >> Senaryo 4: Moderasyon ve Raporlama Yönetim Akışı
- Location: tests\scenarios.spec.ts:131:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5200/
Call log:
  - navigating to "http://localhost:5200/", waiting until "load"

```

# Test source

```ts
  33  |     // Navigate to Search / Artist Profile page
  34  |     const searchInput = page.locator('#search-artists-input');
  35  |     if (await searchInput.count() > 0 && await searchInput.isVisible()) {
  36  |       await searchInput.fill('Ada Lovelace');
  37  |       await searchInput.press('Enter');
  38  |       
  39  |       // Select artist card
  40  |       const artistLink = page.locator('.artist-card-link').first();
  41  |       if (await artistLink.count() > 0) {
  42  |         await artistLink.click();
  43  |         
  44  |         // 2. Profile validation
  45  |         await expect(page).toHaveURL(/.*profile\/[a-zA-Z0-9-]+/);
  46  |         
  47  |         // 3. Send signature request button click
  48  |         const requestBtn = page.locator('#send-sig-request-btn');
  49  |         await expect(requestBtn).toBeVisible();
  50  |         await requestBtn.click();
  51  |         
  52  |         // 4. Fill form & upload file
  53  |         const fileInput = page.locator('input[type="file"]');
  54  |         const messageInput = page.locator('#request-message');
  55  |         const submitRequestBtn = page.locator('#submit-sig-request-btn');
  56  |         
  57  |         await fileInput.setInputFiles(tempImage);
  58  |         await messageInput.fill('Lütfen bu sanat eserimi imzalar mısınız?');
  59  |         await submitRequestBtn.click();
  60  |         
  61  |         // 5. Verify rate limit decrement or success toast
  62  |         const successToast = page.locator('.toast-success, [role="status"]');
  63  |         if (await successToast.count() > 0) {
  64  |           await expect(successToast).toBeVisible();
  65  |         }
  66  |       }
  67  |     }
  68  |   });
  69  | 
  70  |   test('Senaryo 2: Sanatçı Onaylama ve Portföy Güncelleme Akışı', async ({ page }) => {
  71  |     // 1. Artist login
  72  |     await page.goto('/');
  73  |     
  74  |     // Simulate navigation to Artist Dashboard Inbox
  75  |     const dashboardLink = page.locator('#artist-dashboard-link');
  76  |     if (await dashboardLink.count() > 0 && await dashboardLink.isVisible()) {
  77  |       await dashboardLink.click();
  78  |       await expect(page).toHaveURL(/.*dashboard\/inbox.*/);
  79  | 
  80  |       // Find first pending request and approve it
  81  |       const pendingRequestCard = page.locator('.pending-request-card').first();
  82  |       if (await pendingRequestCard.count() > 0) {
  83  |         const approveBtn = pendingRequestCard.locator('.approve-btn');
  84  |         await approveBtn.click();
  85  | 
  86  |         // Wait for digital signature and watermark process to run via SignalR/polling
  87  |         const signatureSuccessToast = page.locator('.toast-success, .signature-completed');
  88  |         if (await signatureSuccessToast.count() > 0) {
  89  |           await expect(signatureSuccessToast).toBeVisible();
  90  |         }
  91  | 
  92  |         // Verify content appears in top works or portfolio
  93  |         await page.goto('/profile/ada');
  94  |         const signedWork = page.locator('.portfolio-grid img').first();
  95  |         await expect(signedWork).toBeVisible();
  96  |       }
  97  |     }
  98  |   });
  99  | 
  100 |   test('Senaryo 3: Fan Bildirim ve Koleksiyon Takip Süreci', async ({ page }) => {
  101 |     // Simulate notification receiving and collection display
  102 |     await page.goto('/collection');
  103 |     
  104 |     // Check if the signed item with watermark is visible in collection
  105 |     const collectionItem = page.locator('.collection-grid-item').first();
  106 |     if (await collectionItem.count() > 0) {
  107 |       await expect(collectionItem).toBeVisible();
  108 |       
  109 |       // Share on feed
  110 |       const shareBtn = collectionItem.locator('.share-on-feed-btn');
  111 |       if (await shareBtn.count() > 0 && await shareBtn.isVisible()) {
  112 |         await shareBtn.click();
  113 |         
  114 |         // Go to feed & check like functionality
  115 |         await page.goto('/feed');
  116 |         const feedCard = page.locator('.feed-card').first();
  117 |         await expect(feedCard).toBeVisible();
  118 |         
  119 |         const likeBtn = feedCard.locator('.like-btn');
  120 |         const initialLikes = await feedCard.locator('.like-count').textContent();
  121 |         await likeBtn.click();
  122 |         
  123 |         // Wait and check if count incremented
  124 |         await page.waitForTimeout(500);
  125 |         const newLikes = await feedCard.locator('.like-count').textContent();
  126 |         expect(Number(newLikes)).toBeGreaterThan(Number(initialLikes));
  127 |       }
  128 |     }
  129 |   });
  130 | 
  131 |   test('Senaryo 4: Moderasyon ve Raporlama Yönetim Akışı', async ({ page }) => {
  132 |     // Simulating Admin moderating offensive content
> 133 |     await page.goto('http://localhost:5200'); // Blazor BackOffice Port
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5200/
  134 |     
  135 |     // Check for login / title of dashboard
  136 |     const adminHeader = page.locator('h1, .admin-title');
  137 |     if (await adminHeader.count() > 0) {
  138 |       // Navigate to Moderation Page
  139 |       await page.goto('http://localhost:5200/moderation');
  140 |       
  141 |       // Flag the content as soft deleted
  142 |       const flagBtn = page.locator('.flag-content-btn').first();
  143 |       if (await flagBtn.count() > 0 && await flagBtn.isVisible()) {
  144 |         await flagBtn.click();
  145 |         await page.waitForTimeout(500);
  146 |         
  147 |         // Verify it is no longer listed in public feed
  148 |         await page.goto('http://localhost:3000/feed');
  149 |         const matchingItems = page.locator('.feed-card');
  150 |         // Make sure it doesn't display flagged ID (normally we check by data-id or text)
  151 |         expect(await matchingItems.count()).toBeLessThan(10); // Check that it is removed
  152 |       }
  153 |     }
  154 |   });
  155 | });
  156 | 
```