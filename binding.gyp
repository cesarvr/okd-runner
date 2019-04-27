{
  "targets": [
    {
      "target_name": "blocking",
      "sources": [ "blocking.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
