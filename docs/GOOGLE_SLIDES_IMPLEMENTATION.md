# Google Slides Export Implementation Plan

## Overview
Add Google Slides export functionality to the strategic brief builder for professional presentation generation.

## Complexity: Medium (7/10)
- **Time Estimate**: 2-3 days development
- **Dependencies**: Google Cloud Console setup required
- **User Impact**: High value - professional presentations from briefs

## Technical Requirements

### 1. Dependencies
```bash
npm install googleapis
```

### 2. Google Cloud Setup
- Enable Google Slides API
- Configure OAuth 2.0 credentials
- Set up redirect URIs for authentication

### 3. Environment Variables
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

## Implementation Plan

### Phase 1: Authentication Setup
```typescript
// server/services/google-auth.ts
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class GoogleAuthService {
  generateAuthUrl() {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/presentations']
    });
  }
  
  async exchangeCodeForTokens(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  }
}
```

### Phase 2: Slides Service
```typescript
// server/services/google-slides.ts
export class GoogleSlidesService {
  async createPresentationFromBrief(briefData: Brief, userTokens: any) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(userTokens);
    
    const slides = google.slides({ version: 'v1', auth });
    
    // Create presentation
    const presentation = await slides.presentations.create({
      requestBody: {
        title: briefData.title
      }
    });
    
    // Add slides with content
    await this.addBriefSlides(slides, presentation.data.presentationId, briefData);
    
    return presentation.data;
  }
  
  private async addBriefSlides(slides: any, presentationId: string, brief: Brief) {
    const requests = [
      // Title slide
      this.createTitleSlide(brief.title),
      // Executive summary
      this.createSummarySlide(brief.content),
      // Key insights from signals
      ...brief.signals.map(signal => this.createSignalSlide(signal)),
      // Strategic recommendations
      this.createRecommendationsSlide(brief.signals)
    ];
    
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests }
    });
  }
}
```

### Phase 3: Frontend Integration
```typescript
// client/components/brief-builder.tsx - Add to export options
const handleGoogleSlidesExport = async () => {
  try {
    setIsExporting(true);
    
    // Check if user has Google auth
    const authStatus = await checkGoogleAuth();
    if (!authStatus.authenticated) {
      // Redirect to Google OAuth
      window.location.href = '/auth/google';
      return;
    }
    
    // Create slides presentation
    const response = await apiRequest('POST', '/api/briefs/export-slides', {
      briefId: currentBrief.id,
      title: briefTitle,
      content: briefContent,
      signals: selectedSignals
    });
    
    // Open created presentation
    window.open(response.presentationUrl, '_blank');
    
    toast({
      title: "Slides Created",
      description: "Your brief has been exported to Google Slides"
    });
  } catch (error) {
    toast({
      title: "Export Failed",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setIsExporting(false);
  }
};
```

## Slide Template Structure

### Slide 1: Title
- Brief title
- Generation date
- Company/user branding

### Slide 2: Executive Summary
- Key findings overview
- Signal count and sources
- Strategic recommendations preview

### Slide 3-N: Signal Analysis
- One slide per major signal
- Truth analysis framework
- Cohort opportunities
- Attention value indicators

### Final Slide: Action Items
- Next steps
- Strategic recommendations
- Timeline suggestions

## User Experience Flow

1. **User creates brief** in brief builder
2. **Clicks "Export to Slides"** button
3. **First-time**: Redirected to Google OAuth consent
4. **Subsequent**: Direct export to new presentation
5. **Opens automatically** in new tab for editing

## Benefits

### For Users:
- **Professional presentations** ready for stakeholders
- **Visual data representation** with charts and graphs
- **Collaborative editing** via Google Slides sharing
- **Brand consistency** with template customization

### For Platform:
- **Premium feature** differentiation
- **Increased engagement** through professional outputs
- **Integration ecosystem** with Google Workspace

## Security Considerations

- **Token storage**: Encrypted user tokens in database
- **Scope limitations**: Only presentations scope, no broader access
- **Revocation handling**: Graceful degradation if access revoked
- **Rate limiting**: Prevent API quota exhaustion

## Alternative Approaches

### Option 1: Direct API Integration (Recommended)
- Full control over presentation structure
- Custom branding and templates
- Real-time generation

### Option 2: Template-Based
- Pre-built slide templates
- Text replacement approach
- Faster development but less flexible

### Option 3: PowerPoint Export
- Use Open XML SDK
- No Google dependency
- Works offline but less collaborative

## Cost Considerations

- **Google API**: Free tier covers most usage
- **Development time**: 2-3 days initial implementation
- **Maintenance**: Low ongoing effort
- **User value**: High - professional presentation generation

## Recommendation

**Implement Google Slides export** as a premium feature with:
- OAuth-based authentication
- Professional slide templates
- Truth analysis visualization
- Cohort opportunity mapping
- Strategic recommendation formatting

This would significantly enhance the platform's value proposition for strategic professionals who need to present insights to stakeholders.