<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture

- All domain data access must go through `src/lib/data`; UI code never reads localStorage directly, so the mock can later be replaced safely.
- Monetary values are integer cents throughout the domain layer to prevent floating-point errors.
- Booking registration modes share one `BookingDraft` and one save pipeline so both persist identical fields.
- Public content routes use TanStack Query loader prefetch plus suspense queries for consistent SSR and client caches.
