locals {
  common_vars = read_terragrunt_config(find_in_parent_folders("common.hcl"))
  env_vars = read_terragrunt_config("env.hcl")
}

remote_state {
  backend = "s3"

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }

  config = {
    bucket  = "${local.common_vars.inputs.project_name}-${local.env_vars.inputs.env}-tfstate"
    key     = "${run_cmd("--terragrunt-quiet", "bash", "-c", "echo ${get_env("APP_ID")} | tr '[:upper:]' '[:lower:]'")}/terraform.tfstate"
    region  = local.common_vars.inputs.region
    encrypt = true
  }
}

inputs = merge(
  local.common_vars.inputs,
  local.env_vars.inputs
)
