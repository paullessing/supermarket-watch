<script lang="ts">
  import '../styles/reset.scss';
  import '../styles/main.scss';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<svelte:head>
  <title>Supermarket Watch</title>
</svelte:head>

{@render children?.()}
