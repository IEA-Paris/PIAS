terraform {
  source = "../../../modules//PFIAS"
}

include {
  path = find_in_parent_folders()
}
