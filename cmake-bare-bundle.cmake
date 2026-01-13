include_guard()

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

set(bare_bundle_module_dir "${CMAKE_CURRENT_LIST_DIR}")

function(add_bare_bundle target)
  set(option_keywords
    LINKED
  )

  set(one_value_keywords
    ENTRY
    OUT
    BUILTINS
    HOST
    WORKING_DIRECTORY
  )

  set(multi_value_keywords
    DEPENDS
  )

  cmake_parse_arguments(
    PARSE_ARGV 1 ARGV "${option_keywords}" "${one_value_keywords}" "${multi_value_keywords}"
  )

  if(ARGV_WORKING_DIRECTORY)
    cmake_path(ABSOLUTE_PATH ARGV_WORKING_DIRECTORY BASE_DIRECTORY "${CMAKE_CURRENT_LIST_DIR}" NORMALIZE)
  else()
    set(ARGV_WORKING_DIRECTORY "${CMAKE_CURRENT_LIST_DIR}")
  endif()

  if(ARGV_ENTRY)
    cmake_path(ABSOLUTE_PATH ARGV_ENTRY BASE_DIRECTORY "${ARGV_WORKING_DIRECTORY}" NORMALIZE)

    list(APPEND ARGV_DEPENDS "${ARGV_ENTRY}")
  else()
    message(FATAL_ERROR "Argument ENTRY not provided")
  endif()

  if(ARGV_OUT)
    cmake_path(ABSOLUTE_PATH ARGV_OUT BASE_DIRECTORY "${ARGV_WORKING_DIRECTORY}" NORMALIZE)
  else()
    message(FATAL_ERROR "Argument OUT not provided")
  endif()

  if(ARGV_BUILTINS)
    cmake_path(ABSOLUTE_PATH ARGV_BUILTINS BASE_DIRECTORY "${ARGV_WORKING_DIRECTORY}" NORMALIZE)

    list(APPEND ARGV_DEPENDS "${ARGV_BUILTINS}")
  else()
    set(ARGV_BUILTINS 0)
  endif()

  if(NOT DEFINED ARGV_HOST)
    bare_target(ARGV_HOST)
  endif()

  list(REMOVE_DUPLICATES ARGV_DEPENDS)

  set(args
    "${ARGV_ENTRY}"
    "${ARGV_OUT}"
    "${ARGV_BUILTINS}"
    "$<BOOL:${ARGV_LINKED}>"
    "${ARGV_HOST}"
  )

  if(CMAKE_HOST_WIN32)
    find_program(
      node
      NAMES node.cmd node
      REQUIRED
    )
  else()
    find_program(
      node
      NAMES node
      REQUIRED
    )
  endif()

  add_custom_command(
    COMMAND "${node}" "${bare_bundle_module_dir}/dependencies.js" ${args}
    WORKING_DIRECTORY "${ARGV_WORKING_DIRECTORY}"
    OUTPUT "${ARGV_OUT}.d"
    DEPENDS ${ARGV_DEPENDS}
    VERBATIM
  )

  add_custom_command(
    COMMAND "${node}" "${bare_bundle_module_dir}/bundle.js" ${args}
    WORKING_DIRECTORY "${ARGV_WORKING_DIRECTORY}"
    OUTPUT "${ARGV_OUT}"
    DEPENDS "${ARGV_OUT}.d"
    DEPFILE "${ARGV_OUT}.d"
    VERBATIM
  )

  add_custom_target(
    ${target}
    ALL
    DEPENDS "${ARGV_OUT}"
  )
endfunction()
