# Router Setup Information

## Current Router Library: wouter (not React Router)

This project uses **wouter** version 3.7.1, which is a lightweight alternative to React Router.

### Key Dependencies:
```json
{
  "wouter": "3.7.1",
  "@vitejs/plugin-react": "4.3.3",
  "vite": "5.4.19"
}
```

## Router Architecture Explanation:

### 1. No createBrowserRouter() 
Wouter doesn't use `createBrowserRouter()`. Instead it uses:
```jsx
<Router>
  <Route path="/dashboard" component={Dashboard} />
  <Route path="*" component={NotFound} />
</Router>
```

### 2. No RouterProvider
Wouter's `<Router>` component acts as both router and provider.

### 3. Custom Routing Implementation
We implemented a custom `RoutingComponent` that:
- Uses `useLocation()` hook from wouter
- Handles route matching with switch/case logic
- Implements catch-all routing in the default case
- Provides authentication checks per route

### 4. Error Handling
Instead of React Router's `errorElement`, we use:
- React Error Boundaries wrapping the entire app
- Global error handlers for unhandled promise rejections
- Try/catch blocks around routing logic

## Why This Approach:
1. **Compatibility**: wouter 3.7.1 + Vite 5.4.19 proven working combination
2. **Lightweight**: Smaller bundle size than React Router
3. **Flexibility**: Custom routing logic allows for complex authentication flows
4. **Error Resilience**: Multiple layers of error handling

## Migration Note:
If you prefer React Router, we'd need to:
1. Install react-router-dom
2. Replace wouter imports
3. Restructure routing to use createBrowserRouter()
4. Update error handling to use errorElement prop