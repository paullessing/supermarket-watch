<script lang="ts">
  import SearchBox, { type SearchParams } from './search/SearchBox.svelte';
  import { goto } from '$app/navigation';

  let isSearching: boolean = $state(false);

  function onSearch({ query, sortBy }: SearchParams): void {
    isSearching = true;
    const params = new URLSearchParams({
      query,
      sortBy,
    });
    goto(`/search?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Supermarket Watch</title>
</svelte:head>

<div class="content">
  <h1 class="title">Shopping</h1>
  <ul>
    <li style="margin-bottom: 1rem; font-size: 1.2rem">
      <a href="/search">Search</a><br />
      <SearchBox {onSearch} {isSearching}></SearchBox>
    </li>
    <li style="margin-bottom: 1rem; font-size: 1.2rem">
      <a href="/tracked-items">Tracked Items</a>
    </li>
  </ul>
</div>
