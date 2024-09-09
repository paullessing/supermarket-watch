<script
  context="module"
  lang="ts"
>
  export interface SearchParams {
    query: string;
    sortBy: SortBy;
  }
</script>
<script lang="ts">
  import { SortBy } from "$lib";
  import { createEventDispatcher } from "svelte";

  export let isSearching: boolean = false;
  export let searchText: string = '';
  export let sortBy: SortBy = SortBy.NONE;

  const dispatch = createEventDispatcher<{
    search: SearchParams
  }>();

  let onSearch = (event: SubmitEvent): void => {
    event.preventDefault();
    dispatch('search', {
      query: searchText,
      sortBy
    })
  }
</script>

<form on:submit="{onSearch}">
  <input
    name="queryString"
    bind:value={searchText}
  >
  <select
    name="sortBy"
    bind:value={sortBy}
    disabled="{isSearching}"
    class="sort-by"
  >
    <option value={SortBy.NONE}>None</option>
    <option value={SortBy.PRICE}>Price</option>
    <option value={SortBy.SPECIAL_OFFERS}>Offers</option>
    <option value={SortBy.SUPERMARKET}>Supermarket</option>
  </select>
  <button
    type="submit"
    disabled={isSearching}
  >{ isSearching ? 'Searching...' : 'Search' }</button>
</form>
