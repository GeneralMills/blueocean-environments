Adds a page to Blue Ocean that displays what environments (Dev, QA, Prod) a pipeline has been deployed to.

It uses stage names to determine what constitutes a deploy to an environment.  A successful "Development" step may mean
that the pipeline has made it to Development. Since stage names are flexible, the stage names that represent Dev, QA,
and Prod can be configured on the global configuration page.  It is a comma delimited list of names. 