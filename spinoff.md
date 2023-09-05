## How to create a PIAS platform

1. Fork the boilerpalte repo
2. Clone it locally. The name or the repo will be used all along as an identifier for the platform. It is case sensitive.
3. Ask for a certificate matching the domain name of the new platform at AWS ACM. This is a public certificate, free, but it requires to add a record to the DNS table to verify it (see AWS UI)
4. Update the `config.js` file as well as the `.github/workflows/ci.yml` and `.github/workflows/infra.yml`. Note that the `infra.yml` inputs will have to be updated once you have an ACM certificate ARN for your custom domain.
5. Update the CMS config file as well at `static/admin/config.yml`
6. Make sure the repo has access to the organization secrets such as the AWS deployment keys
7. Add the user `service-dev-paris-iea` as contributor to the repo (read/write)
8. Add a secret token (settings > developers > Personal access tokens) `SERVICE_USER_PAT` matching a secret token from the user `service-dev-paris-iea` (dev@paris-iea.fr). It should be a classic token with workflows and repo rights
9. In the PIAS repo, you need to add the new platform as a submodule. e.g. for a `SANDBOX` identifier `git submodule add git@github.com:IEA-Paris/SANDBBOX.git ./submodules/SANDBOX` from the root of the PIAS repo. stage your changes and push them to PIAS main branch
10. Trigger the infra CI for the newly created platform. It should fail as you don't have the cloudfront endpoint in your DNS table
11. Go to AWS ACM in the parameter store. Add 2 keys: `SANDBOX/cloudfront/id` with the Cloudfront distribution ID as value. Also add `SANDBOX/s3/name` with the S3 name (it's created by terraform and should be the identifier in lowercase)
12. Last step: update the DNS table with the newly created cloudfront distribution. e.g. `france 10800 IN CNAME d2hhxxxfthdewz.cloudfront.net.`
13. update the data repository and check that the CI is triggering correctly, the website is deployed as intended and the CMS is available.